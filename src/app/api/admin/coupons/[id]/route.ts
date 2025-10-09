import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    // Extract the 'id' from the request URL's pathname
    const id = req.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ message: "Coupon ID is missing from the URL" }, { status: 400 });
    }

    const body = await req.json();
    const { code, discountType, discountValue } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
      },
    });

    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error) {
    console.error("Failed to update coupon:", error); // Log error for debugging
    return NextResponse.json(
      { message: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract the 'id' from the request URL's pathname
    const id = req.nextUrl.pathname.split("/").pop();

    if (!id) {
        return NextResponse.json({ message: "Coupon ID is missing from the URL" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Coupon deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete coupon:", error); // Log error for debugging
    return NextResponse.json(
      { message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
