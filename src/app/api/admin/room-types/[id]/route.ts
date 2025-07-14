import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// UPDATE RoomType
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
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
    console.error("[ROOMTYPE_PUT]", error);
    return NextResponse.json({ error: "Failed to update room type" }, { status: 500 });
  }
}

// DELETE RoomType
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    await prisma.roomType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Room type deleted successfully" });
  } catch (error) {
    console.error("[ROOMTYPE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete room type" }, { status: 500 });
  }
}
