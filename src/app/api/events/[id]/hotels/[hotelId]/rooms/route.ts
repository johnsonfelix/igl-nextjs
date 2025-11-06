import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, ctx: any) {
  try {
    const { id: eventId, hotelId } = ctx?.params || {};
    if (!eventId || !hotelId) {
      return NextResponse.json({ error: 'id (eventId) and hotelId are required' }, { status: 400 });
    }

    // verify the hotel is linked to this event
    const eventWithHotel = await prisma.event.findFirst({
      where: { id: eventId, hotels: { some: { id: hotelId } } },
      select: { id: true, name: true },
    });
    if (!eventWithHotel) {
      return NextResponse.json(
        { error: 'Event not found or hotel is not associated with this event' },
        { status: 404 }
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, hotelName: true, address: true, image: true },
    });
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

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

    return NextResponse.json({ event: eventWithHotel, hotel, roomTypes });
  } catch (err) {
    console.error('[EVENT/HOTEL_ROOMS_GET]', err);
    return NextResponse.json({ error: 'Failed to fetch room types' }, { status: 500 });
  }
}
