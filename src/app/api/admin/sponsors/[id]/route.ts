import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// DELETE sponsorType
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    await prisma.sponsorType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sponsor type deleted successfully" });
  } catch (error) {
    console.error("[SPONSOR_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete sponsor type" }, { status: 500 });
  }
}

// UPDATE sponsorType
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const data = await req.json();
    const price = Number(data.price);

    if (isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid price: must be a number" },
        { status: 400 }
      );
    }

    const sponsor = await prisma.sponsorType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: price, // Correct type
        image: data.image,
      },
    });

    return NextResponse.json(sponsor);
  } catch (error: any) {
    console.error("[SPONSOR_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update sponsor type", detail: error.message },
      { status: 500 }
    );
  }
}