import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all sponsors
export async function GET() {
  const tickets = await prisma.ticket.findMany();
  return NextResponse.json(tickets);
}

// POST create new sponsor
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, price, logo, features = [] } = body;

  const ticket = await prisma.ticket.create({
    data: {
      name,
      price,
      logo,
      sellingPrice: body.sellingPrice,
      features: features || []
    },
  });

  return NextResponse.json(ticket);
}
