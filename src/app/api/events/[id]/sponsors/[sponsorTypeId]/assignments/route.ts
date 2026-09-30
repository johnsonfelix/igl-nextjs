import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";


export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string; sponsorTypeId: string }> }
) {
    const params = await props.params;
    const { id: eventId, sponsorTypeId } = params;

    try {
        
        
        
        
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

        
        const sponsorType = await prisma.sponsorType.findUnique({
            where: { id: sponsorTypeId },
        });

        if (!sponsorType) {
            return NextResponse.json(
                { error: "Sponsor Type not found" },
                { status: 404 }
            );
        }

        
        
        
        

        const po = await prisma.purchaseOrder.create({
            data: {
                companyId,
                eventId,
                status: "COMPLETED",
                totalAmount: 0, 
                offlinePayment: true,
                billingCountry: "Admin Assigned",
                items: {
                    create: {
                        productType: "SPONSOR",
                        productId: sponsorTypeId,
                        name: sponsorType.name,
                        price: 0, 
                        quantity: 1,
                        
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


export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string; sponsorTypeId: string }> }
) {
    const params = await props.params;
    
    
    
    
    

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
        return NextResponse.json(
            { error: "Order ID is required" },
            { status: 400 }
        );
    }

    try {
        
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!po) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        
        

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
