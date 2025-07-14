import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all booths
export async function GET() {
  try {
    const booths = await prisma.booth.findMany({

    });
    return NextResponse.json(booths);
  } catch (error) {
    console.error("Error fetching booths:", error);
    return NextResponse.json(
      { error: "Failed to fetch booths", details: error },
      { status: 500 }
    );
  }
}

// POST create new booth
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, image, description, eventId } = body;

    const booth = await prisma.booth.create({
      data: {
        name,
        price: parseFloat(price),
        image,
        description: description || null,
        eventId: eventId?.trim() === "" ? null : eventId,
      },
    });

    return NextResponse.json(booth);
  } catch (error) {
    console.error("Error creating booth:", error);
    return NextResponse.json(
      { error: "Failed to create booth", details: error },
      { status: 500 }
    );
  }
}
