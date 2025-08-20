import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/events/[id]/hotel-bookings/[companyId]
 * Fetches detailed information about hotel rooms purchased by a specific company for a given event.
 */
export async function GET(
  request: Request,
  // Change 1: The 'params' object is now wrapped in a Promise and contains both dynamic segments.
  context: { params: Promise<{ id: string; companyId: string }> }
) {
  // Change 2: You must 'await' context.params to access the route parameters.
  const { id: eventId, companyId } = await context.params;

  if (!eventId || !companyId) {
    return NextResponse.json(
      { error: 'Event ID and Company ID are required' },
      { status: 400 }
    );
  }

  try {
    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          eventId: eventId,
          companyId: companyId, // Filter by companyId directly from path params
        },
        productType: 'HOTEL',
        roomTypeId: { not: null },
      },
      select: {
        productId: true, // This is the hotelId
        roomTypeId: true,
        order: {
          select: { company: { select: { name: true } } },
        },
      },
    });

    // Extract unique IDs to fetch details efficiently
    const hotelIds = [...new Set(purchasedItems.map(item => item.productId))];
    const roomTypeIds = [
      ...new Set(
        purchasedItems
          .map(item => item.roomTypeId)
          .filter((id): id is string => !!id)
      ),
    ];

    // 2. Fetch all related hotels and room types in two separate queries
    const hotels = await prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      select: { id: true, hotelName: true, image: true, address: true },
    });
    const roomTypes = await prisma.roomType.findMany({
      where: { id: { in: roomTypeIds } },
      select: { id: true, roomType: true, amenities: true },
    });

    // 3. Create maps for quick lookup
    const hotelMap = new Map(hotels.map(h => [h.id, h]));
    const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt]));

    // 4. Construct the detailed result object
    const result = purchasedItems
      .map(item => {
        const hotel = hotelMap.get(item.productId);
        const roomType = item.roomTypeId ? roomTypeMap.get(item.roomTypeId) : null;
        const companyName = item.order.company?.name;

        // Skip if any essential data is missing
        if (!hotel || !roomType || !companyName) return null;

        return {
          companyName,
          hotel: {
            name: hotel.hotelName,
            image: hotel.image,
            address: hotel.address,
          },
          room: {
            name: roomType.roomType,
            amenities: roomType.amenities,
          },
        };
      })
      .filter(Boolean); // Filter out any null entries

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch hotel bookings:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching hotel bookings.' },
      { status: 500 }
    );
  }
}
