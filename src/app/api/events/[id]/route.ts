// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Helper to extract eventId from URL
function extractEventId(req: NextRequest): string | null {
  try {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split("/");
    // Adjust if your route structure changes
    const eventId = parts[parts.length - 1];
    if (!eventId || eventId === "events") return null; // prevent returning "events" as ID
    console.log('eventId');
    console.log(eventId);
    return eventId;
  } catch (error) {
    console.error("[extractEventId]", error);
    return null;
  }
}

// ✅ GET single event
export async function GET(req: NextRequest) {
  try {
    const eventId = extractEventId(req);
    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
        agendaItems: true,
        venue: true,
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
    const eventId = extractEventId(req);
    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

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

    // Clear sponsorTypes if reassigning
    await prisma.sponsorType.updateMany({
      where: { eventId },
      data: { eventId: null },
    });

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

    if (sponsorTypes.length > 0) {
      await prisma.sponsorType.updateMany({
        where: { id: { in: sponsorTypes } },
        data: { eventId: updatedEvent.id },
      });
    }

    const refetchedEvent = await prisma.event.findUnique({
      where: { id: updatedEvent.id },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
        agendaItems: true,
        venue: true,
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
    const eventId = extractEventId(req);
    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
