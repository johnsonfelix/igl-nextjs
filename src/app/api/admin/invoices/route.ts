
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // Assuming prisma client instance export

export async function GET(request: Request) {
    try {
        const invoices = await prisma.manualInvoice.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { invoiceNumber, date, customerDetails, items, totalAmount, companyId } = body;

        // 1. Create Manual Invoice (Always)
        const invoice = await prisma.manualInvoice.create({
            data: {
                invoiceNumber,
                date: new Date(date),
                customerDetails, // Json
                items, // Json
                totalAmount,
                currency: body.currency || "USD" // Default to USD if not provided
            }
        });

        // 2. Conditionally Create Purchase Order (If Company ID exists)
        if (companyId) {
            // Determine eventId from product associations
            let eventId: string | undefined;

            for (const item of items) {
                if (eventId) break;
                const pid = item.productId;
                if (!pid || pid === "MANUAL_ITEM") continue;

                const pType = (item.productType || "").toUpperCase();

                if (pType === "TICKET") {
                    // Look up event via EventTicket join table
                    const eventTicket = await prisma.eventTicket.findFirst({
                        where: { ticketId: pid },
                        select: { eventId: true },
                    });
                    if (eventTicket) eventId = eventTicket.eventId;
                } else if (pType === "SPONSOR") {
                    // Look up event via EventSponsorType join table
                    const eventSponsor = await prisma.eventSponsorType.findFirst({
                        where: { sponsorTypeId: pid },
                        select: { eventId: true },
                    });
                    if (eventSponsor) eventId = eventSponsor.eventId;
                }
            }

            // Map items to OrderItem structure with normalized productType
            const orderItems = items.map((item: any) => ({
                name: item.name,
                productId: item.productId || "MANUAL_ITEM",
                productType: (item.productType || "MANUAL_ITEM").toUpperCase(),
                quantity: item.quantity,
                price: item.price,
            }));

            await prisma.purchaseOrder.create({
                data: {
                    companyId: companyId,
                    totalAmount: totalAmount,
                    status: "COMPLETED", // Invoices are created after payment is received
                    ...(eventId ? { eventId } : {}),
                    billingAddressLine1: customerDetails.address,
                    billingCity: customerDetails.city,
                    billingCountry: customerDetails.country,
                    items: {
                        create: orderItems
                    },
                    additionalDetails: {
                        notes: "Created via Manual Invoice #" + invoiceNumber,
                        invoiceId: invoice.id
                    },
                    account: {
                        name: customerDetails.name,
                        email: customerDetails.email,
                        companyName: customerDetails.companyName,
                        designation: customerDetails.designation,
                        memberId: customerDetails.memberId,
                        phone: customerDetails.phoneNumber,
                        taxNumber: customerDetails.taxNumber,
                        gstNumber: customerDetails.gstNumber
                    }
                }
            });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
