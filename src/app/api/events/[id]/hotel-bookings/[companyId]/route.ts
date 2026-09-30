import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';


export async function GET(
  request: Request,
  
  context: { params: Promise<{ id: string; companyId: string }> }
) {
  
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
          companyId: companyId, 
        },
        productType: 'HOTEL',
        roomTypeId: { not: null },
      },
      select: {
        productId: true, 
        roomTypeId: true,
        order: {
          select: { company: { select: { name: true } } },
        },
      },
    });

    
    const hotelIds = [...new Set(purchasedItems.map(item => item.productId))];
    const roomTypeIds = [
      ...new Set(
        purchasedItems
          .map(item => item.roomTypeId)
          .filter((id): id is string => !!id)
      ),
    ];

    
    const hotels = await prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      select: { id: true, hotelName: true, image: true, address: true },
    });
    const roomTypes = await prisma.roomType.findMany({
      where: { id: { in: roomTypeIds } },
      select: { id: true, roomType: true, amenities: true },
    });

    
    const hotelMap = new Map(hotels.map(h => [h.id, h]));
    const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt]));

    
    const result = purchasedItems
      .map(item => {
        const hotel = hotelMap.get(item.productId);
        const roomType = item.roomTypeId ? roomTypeMap.get(item.roomTypeId) : null;
        const companyName = item.order.company?.name;

        
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
      .filter(Boolean); 

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch hotel bookings:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching hotel bookings.' },
      { status: 500 }
    );
  }
}
