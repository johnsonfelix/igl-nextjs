// D:\Projects\Logistics\web\backend-api\src\app\api\events\[id]\route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Helper to extract eventId from URL
function extractEventId(req: NextRequest): string | null {
  try {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split("/");
    const eventId = parts[parts.length - 1];
    if (!eventId || eventId === "events" || eventId === "") return null;
    return eventId;
  } catch (error) {
    console.error("[extractEventId]", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const eventId = extractEventId(req);
    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        // include eventBooths (with quantities) and the nested booth (and booth.subTypes filtered for this event)
        eventBooths: {
          include: {
            booth: {
              include: {
                // include subTypes but only those tied to this event (BoothSubType uses eventId)
                subTypes: {
                  where: { eventId }, // only relevant subtypes for this event
                },
              },
            },
          },
        },

        // hotels with roomTypes and their eventRoomTypes (only for this event)
        hotels: {
          include: {
            roomTypes: {
              include: {
                eventRoomTypes: {
                  where: { eventId },
                },
              },
            },
          },
        },

        eventTickets: { include: { ticket: true } },
        eventSponsorTypes: {
          include: { sponsorType: true },
          orderBy: {
            sponsorType: {
              sortOrder: 'asc'
            }
          }
        },
        eventRoomTypes: {
          where: { eventId },
        },
        agendaItems: true,
        venue: true,
        purchaseOrders: {
          where: {
            status: 'COMPLETED',
            items: {
              some: {
                productType: 'SPONSOR'
              }
            }
          },
          include: {
            company: {
              include: {
                media: true,
                location: true
              }
            },
            items: {
              where: {
                productType: 'SPONSOR'
              }
            }
          }
        }
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
      booths = [],         // now expected as array of { id: string, quantity: number }
      hotels = [],
      tickets = [],        // array of { id, quantity }
      sponsorTypes = [],   // array of { id, quantity }
      roomTypes = [],      // array of { id, quantity }
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

        // eventBooths create with quantity per booth
        eventBooths: {
          create: (booths || []).map((b: { id: string; quantity?: number }) => ({
            booth: { connect: { id: b.id } },
            quantity: b.quantity ?? 1,
          })),
        },

        hotels: {
          connect: (hotels || []).map((id: string) => ({ id })),
        },

        eventTickets: {
          create: (tickets || []).map(({ id, quantity }: { id: string; quantity?: number }) => ({
            ticket: { connect: { id } },
            quantity: quantity ?? 1,
          })),
        },

        eventSponsorTypes: {
          create: (sponsorTypes || []).map(({ id, quantity }: { id: string; quantity?: number }) => ({
            sponsorType: { connect: { id } },
            quantity: quantity ?? 1,
          })),
        },

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
    console.log('Update event body:', body);
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
      booths = [],         // array of { id: string, quantity: number }
      hotels = [],         // array of hotel IDs
      tickets = [],        // array of { id: string, quantity: number }
      sponsorTypes = [],   // array of { id: string, quantity: number }
      roomTypes = [],
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

        // Replace eventBooths: remove existing and create new entries with quantity
        eventBooths: {
          deleteMany: {}, // remove all existing eventBooths for this event
          create: (booths || []).map(({ id: boothId, quantity }: { id: string; quantity?: number }) => ({
            booth: { connect: { id: boothId } },
            quantity: quantity ?? 1,
          })),
        },

        // hotels set
        hotels: {
          set: (hotels || []).map((hId: string) => ({ id: hId })),
        },

        eventTickets: {
          deleteMany: {},
          create: (tickets || []).map(({ id: ticketId, quantity }: { id: string; quantity?: number }) => ({
            ticket: { connect: { id: ticketId } },
            quantity: quantity ?? 1,
          })),
        },

        eventSponsorTypes: {
          deleteMany: {},
          create: (sponsorTypes || []).map(({ id: sponsorTypeId, quantity }: { id: string; quantity?: number }) => ({
            sponsorType: { connect: { id: sponsorTypeId } },
            quantity: quantity ?? 1,
          })),
        },

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
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: any) {
  const params = ctx?.params;
  const id = typeof params?.id === 'string' ? params.id : undefined;

  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const eventWithOrders = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        purchaseOrders: { select: { id: true }, take: 1 },
      },
    });

    if (!eventWithOrders) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (eventWithOrders.purchaseOrders?.length) {
      return NextResponse.json(
        { error: 'Event has purchase orders. Cancel or remove them before deleting the event.' },
        { status: 409 }
      );
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: 'Event deleted' }, { status: 200 });
  } catch (err) {
    console.error('[EVENT_DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
