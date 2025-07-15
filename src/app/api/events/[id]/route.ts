// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// ✅ GET single event
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// ✅ UPDATE single event
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();
    const {
      name,
      startDate,
      endDate,
      location,
      thumbnail,
      eventType,
      expectedAudience,
      description,
      booths = [],
      hotels = [],
      tickets = [],
      sponsorTypes = [],
    } = body;

    if (!name || !startDate || !endDate || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Clear existing sponsorTypes
    await prisma.sponsorType.updateMany({
      where: { eventId },
      data: { eventId: null },
    });

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        thumbnail: thumbnail || null,
        eventType,
        expectedAudience: expectedAudience || null,
        booths: { set: booths.map((id: string) => ({ id })) },
        hotels: { set: hotels.map((id: string) => ({ id })) },
        tickets: { set: tickets.map((id: string) => ({ id })) },
      },
    });

    // Reattach sponsorTypes
    if (sponsorTypes.length > 0) {
      await prisma.sponsorType.updateMany({
        where: { id: { in: sponsorTypes } },
        data: { eventId: updatedEvent.id },
      });
    }

    // Refetch with attachments
    const refetchedEvent = await prisma.event.findUnique({
      where: { id: updatedEvent.id },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });

    return NextResponse.json(refetchedEvent);
  } catch (error) {
    console.error("[EVENT_PUT]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ✅ DELETE single event
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    await prisma.event.delete({
      where: { id: eventId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
