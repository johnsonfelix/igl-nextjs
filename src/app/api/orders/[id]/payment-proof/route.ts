import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { deleteS3Object } from "@/app/lib/s3";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { paymentProof } = body;

        if (!paymentProof) {
            return NextResponse.json(
                { error: "Payment proof URL is required" },
                { status: 400 }
            );
        }

        const order = await prisma.purchaseOrder.update({
            where: { id },
            data: { paymentProof },
        });

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error("Error uploading payment proof:", error);
        return NextResponse.json(
            { error: "Failed to upload payment proof" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the current order to retrieve the payment proof URL
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            select: { paymentProof: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Delete the file from S3 if it exists
        if (order.paymentProof) {
            await deleteS3Object(order.paymentProof);
        }

        // Remove the payment proof URL from the database
        await prisma.purchaseOrder.update({
            where: { id },
            data: { paymentProof: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting payment proof:", error);
        return NextResponse.json(
            { error: "Failed to delete payment proof" },
            { status: 500 }
        );
    }
}
