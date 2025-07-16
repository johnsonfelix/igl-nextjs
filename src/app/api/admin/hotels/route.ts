import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all hotels
export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      include: {
        roomTypes: true, // ✅ include linked room types
      },
    });
    return NextResponse.json(hotels);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
  }
}

// CREATE new hotel
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const hotel = await prisma.hotel.create({
      data: {
        hotelName: body.hotelName,
        image: body.image,
        address: body.address || null,
        contact: body.contact || null,
        eventId: body.eventId?.trim() || null,
      },
    });
    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Create hotel error:", error);
    return NextResponse.json({ error: "Failed to create hotel" }, { status: 500 });
  }
}
