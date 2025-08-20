import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all sponsors
export async function GET() {
  try {
    const booths = await prisma.sponsorType.findMany({

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

// POST create new sponsor
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, image, description,price } = body;

  const sponsor = await prisma.sponsorType.create({
    data: { name, image, description,price: parseFloat(price), },
  });

  return NextResponse.json(sponsor);
}
