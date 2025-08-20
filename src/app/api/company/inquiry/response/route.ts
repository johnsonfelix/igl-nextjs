import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { inquiryId, responderId, message, offerPrice } = body;

  if (!inquiryId || !responderId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const response = await prisma.inquiryResponse.create({
      data: {
        inquiryId,
        responderId,
        message,
        offerPrice,
      },
    });
    return NextResponse.json({ success: true, id: response.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
