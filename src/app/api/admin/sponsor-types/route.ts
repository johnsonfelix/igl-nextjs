// src/app/api/admin/sponsor-types/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const sponsorTypes = await prisma.sponsorType.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { name: "asc" },
    });
    const payload = sponsorTypes.map((s) => ({ id: s.id, name: s.name, price: s.price }));
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/admin/sponsor-types error:", err);
    return NextResponse.json({ error: "Failed to fetch sponsor types" }, { status: 500 });
  }
}
