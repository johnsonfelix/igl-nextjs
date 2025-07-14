import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all sponsors
export async function GET() {
  const sponsors = await prisma.sponsorType.findMany();
  return NextResponse.json(sponsors);
}

// POST create new sponsor
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, image, description,price } = body;

  const sponsor = await prisma.sponsorType.create({
    data: { name, image, description,price },
  });

  return NextResponse.json(sponsor);
}
