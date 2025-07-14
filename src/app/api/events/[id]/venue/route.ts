import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// ✅ GET venue
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const venue = await prisma.venue.findFirst({
      where: { eventId },
    });

    return NextResponse.json(venue || {});
  } catch (error) {
    console.error("[VENUE_GET]", error);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}

// ✅ POST venue
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();
    const venue = await prisma.venue.create({
      data: {
        name: body.name,
        description: body.description || null,
        imageUrls: body.imageUrls || [],
        closestAirport: body.closestAirport || null,
        publicTransport: body.publicTransport || null,
        event: { connect: { id: eventId } },
      },
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error("[VENUE_POST]", error);
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
}

// ✅ PUT venue
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();

    const existingVenue = await prisma.venue.findFirst({
      where: { eventId },
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const updated = await prisma.venue.update({
      where: { id: existingVenue.id },
      data: {
        name: body.name,
        description: body.description || null,
        imageUrls: body.imageUrls || [],
        closestAirport: body.closestAirport || null,
        publicTransport: body.publicTransport || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[VENUE_PUT]", error);
    return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
  }
}
