import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// ✅ GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true, // ✅ include sponsorTypes in GET response
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// ✅ CREATE event
export async function POST(req: Request) {
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
      booths = [],
      hotels = [],
      tickets = [],
      sponsorTypes = [], // ✅ receive sponsorType IDs
    } = body;

    if (!name || !startDate || !endDate || !location) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // ✅ Create event first
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        thumbnail,
        eventType,
        expectedAudience,
        booths: {
          connect: booths.map((id: string) => ({ id })),
        },
        hotels: {
          connect: hotels.map((id: string) => ({ id })),
        },
        tickets: {
          connect: tickets.map((id: string) => ({ id })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });

    // ✅ Attach sponsorTypes by updating their eventId
    if (sponsorTypes.length > 0) {
      await prisma.sponsorType.updateMany({
        where: { id: { in: sponsorTypes } },
        data: { eventId: event.id },
      });
    }

    // ✅ Fetch updated event with sponsorTypes included
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// ✅ UPDATE event
export async function PUT(req: Request) {
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
      booths = [],
      hotels = [],
      tickets = [],
      sponsorTypes = [],
    } = body;

    if (!id || !name || !startDate || !endDate || !location) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // ✅ Clear previous sponsorType attachments for this event
    await prisma.sponsorType.updateMany({
      where: { eventId: id },
      data: { eventId: null },
    });

    // ✅ Update the event with new data and attachments
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        thumbnail,
        eventType,
        expectedAudience,
        booths: {
          set: booths.map((id: string) => ({ id })),
        },
        hotels: {
          set: hotels.map((id: string) => ({ id })),
        },
        tickets: {
          set: tickets.map((id: string) => ({ id })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });

    // ✅ Attach sponsorTypes by updating their eventId
    if (sponsorTypes.length > 0) {
      await prisma.sponsorType.updateMany({
        where: { id: { in: sponsorTypes } },
        data: { eventId: updatedEvent.id },
      });
    }

    // ✅ Fetch updated event with sponsorTypes included
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
    console.error('[EVENTS_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
