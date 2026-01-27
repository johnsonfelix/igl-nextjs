
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
        const { invoiceNumber, date, customerDetails, items, totalAmount } = body;

        const invoice = await prisma.manualInvoice.create({
            data: {
                invoiceNumber,
                date: new Date(date),
                customerDetails, // Json
                items, // Json
                totalAmount
            }
        });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
