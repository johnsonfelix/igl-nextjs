
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, companyId, cartItems } = body;

        if (!code) {
            return NextResponse.json({ message: "Coupon code is required" }, { status: 400 });
        }

        const normalizedCode = code.toString().trim();

        // Find valid coupon
        const coupon = await prisma.coupon.findFirst({
            where: {
                code: {
                    equals: normalizedCode,
                    mode: 'insensitive', // Case insensitive search
                },
            },
        });

        if (!coupon) {
            return NextResponse.json({ message: "Invalid coupon code" }, { status: 404 });
        }

        // Return coupon details
        return NextResponse.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
        });
    } catch (error) {
        console.error("Apply coupon error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
