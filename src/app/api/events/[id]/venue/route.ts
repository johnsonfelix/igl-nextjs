import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// ✅ GET venue
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split('/');
    const eventId = pathnameParts[pathnameParts.length - 2];

    const venue = await prisma.venue.findFirst({
      where: { eventId },
    });

    return NextResponse.json(venue || {});
  } catch (error) {
    console.error('[VENUE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
  }
}

// ✅ POST venue with safety checks
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split('/');
    const eventId = pathnameParts[pathnameParts.length - 2];

    // ✅ Ensure the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found. Cannot create venue.' }, { status: 404 });
    }

    // ✅ Ensure a Venue does not already exist for this event
    const existingVenue = await prisma.venue.findUnique({
      where: { eventId },
    });

    if (existingVenue) {
      return NextResponse.json({ error: 'Venue already exists for this event.' }, { status: 409 });
    }

    const body = await req.json();

    const venue = await prisma.venue.create({
      data: {
        name: body.name,
        description: body.description || null,
        location: body.location || null, // <-- ADDED
        imageUrls: body.imageUrls || [],
        closestAirport: body.closestAirport || null,
        publicTransport: body.publicTransport || null,
        nearbyPlaces: body.nearbyPlaces || null,
        event: { connect: { id: eventId } },
      },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('[VENUE_POST]', error);
    return NextResponse.json({ error: 'Failed to create venue', detail: String(error) }, { status: 500 });
  }
}

// ✅ PUT venue
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split('/');
    const eventId = pathnameParts[pathnameParts.length - 2];

    const body = await req.json();

    const existingVenue = await prisma.venue.findFirst({
      where: { eventId },
    });

    if (!existingVenue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const updated = await prisma.venue.update({
      where: { id: existingVenue.id },
      data: {
        name: body.name,
        description: body.description || null,
        location: body.location || null, // <-- ADDED
        imageUrls: body.imageUrls || [],
        closestAirport: body.closestAirport || null,
        publicTransport: body.publicTransport || null,
        nearbyPlaces: body.nearbyPlaces || null, // <-- ADDED for consistency
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[VENUE_PUT]', error);
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
  }
}