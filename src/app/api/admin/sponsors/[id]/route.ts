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
