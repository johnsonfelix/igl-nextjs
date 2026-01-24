import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        name: true,
                        logoUrl: true,
                    },
                },
                event: {
                    select: {
                        name: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        price: true,
                        productType: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Structure billing and shipping addresses from separate fields
        const billingAddress = {
            line1: order.billingAddressLine1,
            line2: order.billingAddressLine2,
            city: order.billingCity,
            state: order.billingState,
            zip: order.billingZip,
            country: order.billingCountry,
        };

        const shippingAddress = {
            line1: order.shippingAddressLine1,
            line2: order.shippingAddressLine2,
            city: order.shippingCity,
            state: order.shippingState,
            zip: order.shippingZip,
            country: order.shippingCountry,
        };

        // For now, return order with structured addresses
        // account and additionalDetails will be available once schema is migrated
        return NextResponse.json({
            ...order,
            billingAddress,
            shippingAddress,
            account: (order as any).account || {},
            additionalDetails: (order as any).additionalDetails || {},
            paymentMethod: (order as any).paymentMethod || "unknown",
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        return NextResponse.json(
            { error: "Failed to fetch order details" },
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
        await prisma.purchaseOrder.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: error.message || "Failed to delete order" }, { status: 500 });
    }
}

