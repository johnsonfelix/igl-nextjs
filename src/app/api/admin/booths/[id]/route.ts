import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET one booth
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const booth = await prisma.booth.findUnique({
      where: { id },
    });

    if (!booth) {
      return NextResponse.json({ error: "Booth not found" }, { status: 404 });
    }

    return NextResponse.json(booth);
  } catch (error) {
    console.error("[BOOTH_GET]", error);
    return NextResponse.json({ error: "Failed to fetch booth" }, { status: 500 });
  }
}

// PUT update booth
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();
    const { name, price, image } = body;

    const booth = await prisma.booth.update({
      where: { id },
      data: { name, price: parseFloat(price), image },
    });

    return NextResponse.json(booth);
  } catch (error) {
    console.error("[BOOTH_PUT]", error);
    return NextResponse.json({ error: "Failed to update booth" }, { status: 500 });
  }
}

// DELETE booth
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    await prisma.booth.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Booth deleted successfully" });
  } catch (error) {
    console.error("[BOOTH_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete booth" }, { status: 500 });
  }
}
