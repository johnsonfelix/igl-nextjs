import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET single hotel
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const hotel = await prisma.hotel.findUnique({
      where: { id },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("[HOTEL_GET]", error);
    return NextResponse.json({ error: "Failed to fetch hotel" }, { status: 500 });
  }
}

// UPDATE hotel
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();

    const hotel = await prisma.hotel.update({
      where: { id },
      data: {
        hotelName: body.hotelName,
        address: body.address || null,
        contact: body.contact || null,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        image:body.image || null,
      },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("[HOTEL_PUT]", error);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 500 });
  }
}

// DELETE hotel
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    await prisma.hotel.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("[HOTEL_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 500 });
  }
}
