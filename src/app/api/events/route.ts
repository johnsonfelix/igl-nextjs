// app/api/events/route.ts

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
        tickets: true,
        sponsorTypes: true,
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
      booths = [],
      hotels = [],
      tickets = [],
      sponsorTypes = [], // sponsorType IDs
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
        thumbnail: thumbnail || null,
        eventType,
        expectedAudience: expectedAudience || null,
        booths: {
          connect: booths.map((id: string) => ({ id })),
        },
        hotels: {
          connect: hotels.map((id: string) => ({ id })),
        },
        tickets: {
          connect: tickets.map((id: string) => ({ id })),
        },
        sponsorTypes: {
          connect: sponsorTypes.map((id: string) => ({ id })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
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
      booths = [],
      hotels = [],
      tickets = [],
      sponsorTypes = [],
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
        thumbnail: thumbnail || null,
        eventType,
        expectedAudience: expectedAudience || null,
        booths: {
          set: booths.map((id: string) => ({ id })),
        },
        hotels: {
          set: hotels.map((id: string) => ({ id })),
        },
        tickets: {
          set: tickets.map((id: string) => ({ id })),
        },
        sponsorTypes: {
          set: sponsorTypes.map((id: string) => ({ id })),
        },
      },
      include: {
        booths: true,
        hotels: true,
        tickets: true,
        sponsorTypes: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
