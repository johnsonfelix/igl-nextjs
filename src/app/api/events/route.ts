import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';



export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isFull = searchParams.get('full') === 'true';

    const events = await prisma.event.findMany({
      include: isFull
        ? {
          
          eventBooths: {
            include: {
              booth: {
                include: {
                  
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
        }
        : undefined,
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}


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
      earlyBird = false,
      
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
        earlyBird,

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
  } catch (error: any) {
    console.error('[EVENTS_POST]', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
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

        
        eventBooths: {
          deleteMany: {}, 
          create: (booths || []).map(({ id: boothId, quantity }: { id: string; quantity?: number }) => ({
            booth: { connect: { id: boothId } },
            quantity: quantity ?? 1,
          })),
        },

        
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
        eventRoomTypes: { include: { roomType: true } },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error('[EVENTS_PUT]', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
