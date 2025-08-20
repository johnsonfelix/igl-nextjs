import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// ✅ GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        booths: true,
        hotels: true,
        eventTickets: {
          include: { ticket: true },
        },
        eventSponsorTypes: {
          include: { sponsorType: true },
        },
        eventRoomTypes: {
          include: { roomType: true },
        },
        agendaItems: true,
        venue: true,
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// ✅ CREATE event
export async function POST(req: NextRequest) {
  try {
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
      booths = [],          // array of booth IDs
      hotels = [],          // array of hotel IDs
      tickets = [],         // array of { id: string, quantity: number }
      sponsorTypes = [],    // array of { id: string, quantity: number }
      roomTypes = [],       // array of { id: string, quantity: number }
    } = body;

    if (!name || !startDate || !endDate || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        thumbnail: thumbnail || "",
        eventType,
        expectedAudience: expectedAudience || "",

        // Many-to-many relation connect
        booths: {
          connect: booths.map((id: string) => ({ id })),
        },
        hotels: {
          connect: hotels.map((id: string) => ({ id })),
        },

        // Explicit join model creations with quantities
        eventTickets: {
          create: tickets.map(({ id, quantity }: { id: string; quantity: number }) => ({
            ticket: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
        eventSponsorTypes: {
          create: sponsorTypes.map(({ id, quantity }: { id: string; quantity: number }) => ({
            sponsorType: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
        eventRoomTypes: {
          create: roomTypes.map(({ id, quantity }: { id: string; quantity: number }) => ({
            roomType: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        eventTickets: { include: { ticket: true } },
        eventSponsorTypes: { include: { sponsorType: true } },
        eventRoomTypes: { include: { roomType: true } },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('[EVENTS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ✅ UPDATE event
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      startDate,
      endDate,
      location,
      thumbnail,
      eventType,
      expectedAudience,
      description,
      booths = [],         // array of booth IDs
      hotels = [],         // array of hotel IDs
      tickets = [],        // array of { id: string, quantity: number }
      sponsorTypes = [],   // array of { id: string, quantity: number }
      roomTypes = [],      // array of { id: string, quantity: number }
    } = body;

    if (!id || !name || !startDate || !endDate || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        thumbnail: thumbnail || "",
        eventType,
        expectedAudience: expectedAudience || "",

        // Replace the many-to-many relationships for booths and hotels
        booths: {
          set: booths.map((id: string) => ({ id })),
        },
        hotels: {
          set: hotels.map((id: string) => ({ id })),
        },

        // Replace explicit join models for tickets, sponsorTypes, roomTypes
        eventTickets: {
          // Remove old relations and create new ones to replace quantities + links
          deleteMany: {}, // clear existing
          create: tickets.map(({ id, quantity }: { id: string; quantity: number }) => ({
            ticket: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
        eventSponsorTypes: {
          deleteMany: {},
          create: sponsorTypes.map(({ id, quantity }: { id: string; quantity: number }) => ({
            sponsorType: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
        eventRoomTypes: {
          deleteMany: {},
          create: roomTypes.map(({ id, quantity }: { id: string; quantity: number }) => ({
            roomType: { connect: { id } },
            quantity: quantity || 1,
          })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        eventTickets: { include: { ticket: true } },
        eventSponsorTypes: { include: { sponsorType: true } },
        eventRoomTypes: { include: { roomType: true } },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
