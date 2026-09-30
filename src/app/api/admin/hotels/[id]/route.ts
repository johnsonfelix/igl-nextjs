import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { deleteS3Object } from "@/app/lib/s3";


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


function extractIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

export async function DELETE(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    
    const existing = await prisma.hotel.findUnique({
      where: { id },
      include: { roomTypes: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    
    await Promise.all(
      (existing.roomTypes ?? []).map(async (rt) => {
        const keyOrUrl = (rt as any).imageKey ?? rt.image ?? null;
        if (keyOrUrl) {
          try {
            await deleteS3Object(keyOrUrl);
          } catch (err) {
            console.warn("[HOTEL_DELETE] failed to delete roomType image:", err);
          }
        }
      })
    );

    
    const hotelKeyOrUrl = (existing as any).imageKey ?? existing.image ?? null;
    if (hotelKeyOrUrl) {
      try {
        await deleteS3Object(hotelKeyOrUrl);
      } catch (err) {
        console.warn("[HOTEL_DELETE] failed to delete hotel image:", err);
      }
    }

    
    await prisma.$transaction([
      prisma.roomType.deleteMany({ where: { hotelId: id } }),
      prisma.hotel.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Hotel and its room types deleted successfully" });
  } catch (error) {
    console.error("[HOTEL_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 500 });
  }
}
