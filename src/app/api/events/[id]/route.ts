import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();


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


export async function GET(req: NextRequest) {
  try {
    const eventId = extractEventId(req);
    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        booths: {
      include: {
        subTypes: {
          where: { eventId },  
        }
      }
    },
    boothSubTypes: true,
         hotels: {
          include: {
            roomTypes: {
              // For each room type, include the related EventRoomType record,
              // but only the one that matches the current event.
              include: {
                eventRoomTypes: {
                  where: {
                    eventId: eventId,
                  },
                },
              },
            },
          },
        },
        eventTickets: { include: { ticket: true } },  
        eventSponsorTypes: { include: { sponsorType: true } },
        eventRoomTypes: {
                where: {
                  eventId: eventId,
                },
              },
        agendaItems: true,
        venue: true,
        purchaseOrders: {
  include: {
    items: true,
    company: true,
  },
},
      
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
      booths = [],         
      hotels = [],       
      tickets = [],        
      sponsorTypes = [],    
      roomTypes = [], 
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

        booths: {
          connect: booths.map((id: string) => ({ id })),
        },
        hotels: {
          connect: hotels.map((id: string) => ({ id })),
        },
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
      booths = [],         // array of booth IDs
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

        booths: {
          set: booths.map((id: string) => ({ id })),
        },
        hotels: {
          set: hotels.map((id: string) => ({ id })),
        },
        eventTickets: {
          deleteMany: {},
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
  deleteMany: {}, // remove existing
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
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


export async function DELETE(_req: Request, ctx: any) {
  // split: read raw, then validate/normalize
  const params = ctx?.params
  const id = typeof params?.id === 'string' ? params.id : undefined

  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
  }

  try {
    const eventWithOrders = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        purchaseOrders: { select: { id: true }, take: 1 },
      },
    })

    if (!eventWithOrders) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (eventWithOrders.purchaseOrders?.length) {
      return NextResponse.json(
        { error: 'Event has purchase orders. Cancel or remove them before deleting the event.' },
        { status: 409 }
      )
    }

    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ message: 'Event deleted' }, { status: 200 })
  } catch (err) {
    console.error('[EVENT_DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}