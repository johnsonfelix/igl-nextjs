import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { deleteS3Object } from "@/app/lib/s3";

// GET one ticket
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET_GET]", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

// PUT update ticket
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const id = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();
    const { name, price, logo, features } = body;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        name,
        price,
        logo,
        sellingPrice: body.sellingPrice,
        features: features || []
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET_PUT]", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// DELETE ticket
function extractIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

export async function DELETE(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    // 1) Load the ticket so we know which S3 object to delete
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 2) Prefer a stored key if present; otherwise extract the key from the URL
    const keyOrUrl = (existing as any).logoKey ?? existing.logo ?? null;

    if (keyOrUrl) {
      try {
        await deleteS3Object(keyOrUrl);
      } catch (err) {
        console.warn("[TICKET_DELETE] failed to delete S3 object:", err);
        // Continue with DB deletion even if S3 cleanup fails
      }
    }

    // 3) Delete the DB row
    await prisma.ticket.delete({ where: { id } });

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("[TICKET_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
