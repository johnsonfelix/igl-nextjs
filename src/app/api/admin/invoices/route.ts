
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
                totalAmount
            }
        });

        // 2. Conditionally Create Purchase Order (If Company ID exists)
        if (companyId) {
            // Map items to OrderItem structure
            const orderItems = items.map((item: any) => ({
                name: item.name,
                productId: item.productId || "MANUAL_ITEM", // Fallback if custom
                productType: item.productType || "MANUAL_ITEM",
                quantity: item.quantity,
                price: item.price,
                // Additional fields if needed
            }));

            await prisma.purchaseOrder.create({
                data: {
                    companyId: companyId,
                    totalAmount: totalAmount,
                    status: "PENDING", // So it shows as Pending on Dashboard
                    billingAddressLine1: customerDetails.address,
                    billingCity: customerDetails.city, // Might need parsing if address is string
                    billingCountry: customerDetails.country,
                    // Additional mapping
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
                        taxNumber: customerDetails.taxNumber
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
