import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// ✅ GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        // eventBooths contains { eventId, boothId, quantity } and we include the nested booth
        eventBooths: {
          include: {
            booth: {
              include: {
                // include subTypes (all); if you want to filter per-event you'll do that in single-event GET
                subTypes: true,
              },
            },
          },
        },

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
      // now expecting booths: array of { id: string, quantity?: number }
      booths = [],          // array of { id: string, quantity?: number }
      hotels = [],          // array of hotel IDs
      tickets = [],         // array of { id: string, quantity?: number }
      sponsorTypes = [],    // array of { id: string, quantity?: number }
      roomTypes = [],       // array of { id: string, quantity?: number }
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

        // Create eventBooths entries (join model) with quantity
        eventBooths: {
          create: (booths || []).map((b: { id: string; quantity?: number }) => ({
            booth: { connect: { id: b.id } },
            quantity: b.quantity ?? 1,
          })),
        },

        // Hotels (many-to-many connect by id)
        hotels: {
          connect: (hotels || []).map((id: string) => ({ id })),
        },

        // Tickets join model
        eventTickets: {
          create: (tickets || []).map(({ id, quantity }: { id: string; quantity?: number }) => ({
            ticket: { connect: { id } },
            quantity: quantity ?? 1,
          })),
        },

        // Sponsor types join model
        eventSponsorTypes: {
          create: (sponsorTypes || []).map(({ id, quantity }: { id: string; quantity?: number }) => ({
            sponsorType: { connect: { id } },
            quantity: quantity ?? 1,
          })),
        },

        // Room types join model
        eventRoomTypes: {
          create: (roomTypes || []).map(({ id, quantity }: { id: string; quantity?: number }) => ({
            roomType: { connect: { id } },
            quantity: quantity ?? 1,
          })),
        },
      },
      include: {
        eventBooths: {
          include: { booth: { include: { subTypes: true } } },
        },
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
      // booths now array of { id, quantity }
      booths = [],         // array of { id: string, quantity?: number }
      hotels = [],         // array of hotel IDs
      tickets = [],        // array of { id: string, quantity?: number }
      sponsorTypes = [],   // array of { id: string, quantity?: number }
      roomTypes = [],      // array of { id: string, quantity?: number }
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

        // Replace eventBooths: delete existing join rows and create the new ones with quantities
        eventBooths: {
          deleteMany: {}, // remove existing eventBooth rows for this event
          create: (booths || []).map(({ id: boothId, quantity }: { id: string; quantity?: number }) => ({
            booth: { connect: { id: boothId } },
            quantity: quantity ?? 1,
          })),
        },

        // Replace hotels many-to-many
        hotels: {
          set: (hotels || []).map((hId: string) => ({ id: hId })),
        },

        // Replace tickets join model entries
        eventTickets: {
          deleteMany: {},
          create: (tickets || []).map(({ id: ticketId, quantity }: { id: string; quantity?: number }) => ({
            ticket: { connect: { id: ticketId } },
            quantity: quantity ?? 1,
          })),
        },

        // Replace sponsorTypes join model entries
        eventSponsorTypes: {
          deleteMany: {},
          create: (sponsorTypes || []).map(({ id: sponsorTypeId, quantity }: { id: string; quantity?: number }) => ({
            sponsorType: { connect: { id: sponsorTypeId } },
            quantity: quantity ?? 1,
          })),
        },

        // Replace roomTypes join model entries
        eventRoomTypes: {
          deleteMany: {},
          create: (roomTypes || []).map(({ id: roomTypeId, quantity }: { id: string; quantity?: number }) => ({
            roomType: { connect: { id: roomTypeId } },
            quantity: quantity ?? 1,
          })),
        },
      },
      include: {
        eventBooths: { include: { booth: { include: { subTypes: true } } } },
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
