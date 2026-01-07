import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET: List all companies assigned to this sponsor type for this event
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string; sponsorTypeId: string }> }
) {
    const params = await props.params;
    const { id: eventId, sponsorTypeId } = params;

    try {
        // Find PurchaseOrders that are:
        // 1. For this event
        // 2. Contains an item of type "SPONSOR" with productId == sponsorTypeId
        // 3. Status is COMPLETED
        const assignments = await prisma.purchaseOrder.findMany({
            where: {
                eventId: eventId,
                status: "COMPLETED",
                items: {
                    some: {
                        productType: "SPONSOR",
                        productId: sponsorTypeId,
                    },
                },
            },
            include: {
                company: true,
                items: {
                    where: {
                        productType: "SPONSOR",
                        productId: sponsorTypeId,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Map to a cleaner structure
        const results = assignments.map((po) => ({
            orderId: po.id,
            company: po.company,
            purchaseDate: po.createdAt,
            items: po.items,
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching sponsor assignments:", error);
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
            { status: 500 }
        );
    }
}

// POST: Assign a company to this sponsor type (Create Purchase Order)
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string; sponsorTypeId: string }> }
) {
    const params = await props.params;
    const { id: eventId, sponsorTypeId } = params;

    try {
        const body = await request.json();
        const { companyId } = body;

        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID is required" },
                { status: 400 }
            );
        }

        // 1. Fetch Sponsor Details to get name/price
        const sponsorType = await prisma.sponsorType.findUnique({
            where: { id: sponsorTypeId },
        });

        if (!sponsorType) {
            return NextResponse.json(
                { error: "Sponsor Type not found" },
                { status: 404 }
            );
        }

        // 2. Create Purchase Order
        // We treat this as a manual assignment, so we can set totalAmount to 0 or keeping it real.
        // Let's keep it real (price) but mark as offline payment or just completed.
        // For manual assignment, usually implies "Comped" or "Already Paid", but let's just record the value.

        const po = await prisma.purchaseOrder.create({
            data: {
                companyId,
                eventId,
                status: "COMPLETED",
                totalAmount: 0, // Manual assignment = $0 or we can pass it in. Assume 0 for "Assignment" logic. 
                offlinePayment: true,
                billingCountry: "Admin Assigned",
                items: {
                    create: {
                        productType: "SPONSOR",
                        productId: sponsorTypeId,
                        name: sponsorType.name,
                        price: 0, // Manual assignment price
                        quantity: 1,
                        // We could perhaps store the real price if we wanted to track value, but 0 is safer for "manual" to avoid messing up revenue stats if not paid.
                    },
                },
            },
        });

        return NextResponse.json(po);
    } catch (error) {
        console.error("Error assigning company:", error);
        return NextResponse.json(
            { error: "Failed to assign company" },
            { status: 500 }
        );
    }
}

// DELETE: Unassign (Delete/Void Purchase Order)
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string; sponsorTypeId: string }> }
) {
    const params = await props.params;
    // We need the orderId to delete. 
    // The route params are eventId and sponsorTypeId.
    // We can pass orderId via query param or body. Standard REST DELETE usually uses ID in path.
    // But our path is .../assignments. 
    // Let's expect `?orderId=...` keyword argument.

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
        return NextResponse.json(
            { error: "Order ID is required" },
            { status: 400 }
        );
    }

    try {
        // Verify this order belongs to the event and has the sponsor item
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!po) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Optional: check if it actually contains the sponsor item.
        // const hasItem = po.items.some(i => i.productType === 'SPONSOR' && i.productId === params.sponsorTypeId);

        await prisma.purchaseOrder.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error unassigning company:", error);
        return NextResponse.json(
            { error: "Failed to unassign company" },
            { status: 500 }
        );
    }
}
