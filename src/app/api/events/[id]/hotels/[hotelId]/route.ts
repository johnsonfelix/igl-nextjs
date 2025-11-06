import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, ctx: any) {
  try {
    const params = ctx?.params || {};
    const eventId: string | undefined = params.id;        // <-- event param is [id]
    const hotelId: string | undefined = params.hotelId;   // <-- hotel param is [hotelId]

    if (!eventId || !hotelId) {
      return NextResponse.json({ error: 'id (eventId) and hotelId are required' }, { status: 400 });
    }

    // Make sure the event exists and is linked to the given hotel (defensive check)
    const eventWithHotel = await prisma.event.findFirst({
      where: {
        id: eventId,
        hotels: { some: { id: hotelId } },
      },
      select: { id: true, name: true },
    });

    if (!eventWithHotel) {
      return NextResponse.json(
        { error: 'Event not found or hotel is not associated with this event' },
        { status: 404 }
      );
    }

    // Fetch basic hotel data
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, hotelName: true, address: true, image: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Fetch room types for the hotel and include per-event availability (EventRoomType)
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      include: {
        eventRoomTypes: {
          where: { eventId },
          select: { quantity: true, eventId: true, roomTypeId: true },
        },
      },
      orderBy: { roomType: 'asc' },
    });

    return NextResponse.json({
      event: eventWithHotel, // { id, name }
      hotel,
      roomTypes,
    });
  } catch (err) {
    console.error('[EVENT/HOTEL_ROOMS_GET]', err);
    return NextResponse.json({ error: 'Failed to fetch room types' }, { status: 500 });
  }
}
