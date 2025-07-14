import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Get all RoomTypes
export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany({
    });
    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch room types" }, { status: 500 });
  }
}

// Create RoomType
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const roomType = await prisma.roomType.create({
      data: {
        hotelId: body.hotelId,
        roomType: body.roomType,
        price: body.price,
        availableRooms: body.availableRooms,
        maxOccupancy: body.maxOccupancy,
        amenities: body.amenities || null,
        image: body.image || null,
      },
    });
    return NextResponse.json(roomType);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create room type" }, { status: 500 });
  }
}
