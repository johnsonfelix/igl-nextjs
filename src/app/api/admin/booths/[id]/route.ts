import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { deleteS3Object } from "@/app/lib/s3";


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

function extractIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}


export async function DELETE(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    
    const existing = await prisma.booth.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booth not found" }, { status: 404 });
    }

    
    const keyOrUrl = (existing as any).imageKey ?? existing.image ?? null;

    if (keyOrUrl) {
      try {
        const res = await deleteS3Object(keyOrUrl);
        console.info("[BOOTH_DELETE] deleteS3Object:", res);
      } catch (err) {
        console.warn("[BOOTH_DELETE] failed to delete S3 object:", err);
        
      }
    }

    
    await prisma.booth.delete({ where: { id } });

    return NextResponse.json({ message: "Booth deleted successfully" });
  } catch (error) {
    console.error("[BOOTH_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete booth" }, { status: 500 });
  }
}
