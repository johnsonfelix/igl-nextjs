import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/admin/booth-subtypes?boothId=...&eventId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const boothId = searchParams.get("boothId");
    const eventId = searchParams.get("eventId");

    if (!boothId || !eventId) {
      return NextResponse.json(
        { error: "boothId and eventId are required" },
        { status: 400 }
      );
    }

    const subtypes = await prisma.boothSubType.findMany({
      where: { boothId, eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(subtypes);
  } catch (error) {
    console.error("Error fetching booth subtypes:", error);
    return NextResponse.json(
      { error: "Failed to fetch booth subtypes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/booth-subtypes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      boothId,
      eventId,
      name,
      price,
      description,
      type,
      slotStart,
      slotEnd,
    } = body;

    if (!boothId || !eventId || !name || !price) {
      return NextResponse.json(
        { error: "boothId, eventId, name and price are required" },
        { status: 400 }
      );
    }

    const subtype = await prisma.boothSubType.create({
      data: {
        boothId,
        eventId,
        name,
        price: parseFloat(price),
        description: description || null,
        type: type || "BOOTH_NUMBER",
        slotStart: slotStart ? new Date(slotStart) : null,
        slotEnd: slotEnd ? new Date(slotEnd) : null,
      },
    });

    return NextResponse.json(subtype);
  } catch (error) {
    console.error("Error creating booth subtype:", error);
    return NextResponse.json(
      { error: "Failed to create booth subtype" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/booth-subtypes (toggle availability / basic edits)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isAvailable, name, price, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const subtype = await prisma.boothSubType.update({
      where: { id },
      data: {
        ...(isAvailable !== undefined ? { isAvailable } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json(subtype);
  } catch (error) {
    console.error("Error updating booth subtype:", error);
    return NextResponse.json(
      { error: "Failed to update booth subtype" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/booth-subtypes
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.boothSubType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booth subtype:", error);
    return NextResponse.json(
      { error: "Failed to delete booth subtype" },
      { status: 500 }
    );
  }
}
