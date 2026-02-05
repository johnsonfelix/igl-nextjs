
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const invoice = await prisma.manualInvoice.findUnique({
            where: { id }
        });
        if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        return NextResponse.json(invoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { date, customerDetails, items, totalAmount } = body;

        const invoice = await prisma.manualInvoice.update({
            where: { id },
            data: {
                date: new Date(date),
                customerDetails,
                items,
                totalAmount,
                currency: body.currency
            }
        });

        return NextResponse.json(invoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.manualInvoice.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }
}
