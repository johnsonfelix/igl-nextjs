import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';


export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await context.params;

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    
    const items = await prisma.orderItem.findMany({
      where: {
        productType: 'BOOTH',
        boothSubTypeId: { not: null },
        order: {
          eventId,
        },
      },
      select: {
        id: true,
        name: true,
        boothSubTypeId: true,
        order: {
          select: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (items.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    
    const subtypeIds = Array.from(
      new Set(
        items
          .map((i) => i.boothSubTypeId)
          .filter((id): id is string => !!id)
      )
    );

    if (subtypeIds.length === 0) {
      
      return NextResponse.json([], { status: 200 });
    }

    
    const subTypes = await prisma.boothSubType.findMany({
      where: {
        id: { in: subtypeIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
        slotStart: true,
        slotEnd: true,
        booth: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    
    const subtypeMap = new Map<string, (typeof subTypes)[number]>();
    for (const st of subTypes) {
      subtypeMap.set(st.id, st);
    }

    
    const result = items
      .map((item) => {
        const subTypeId = item.boothSubTypeId;
        if (!subTypeId) return null;

        const sub = subtypeMap.get(subTypeId);
        const companyName = item.order.company?.name;

        
        if (!sub || !companyName) return null;

        return {
          
          boothName: item.name,
          companyName,

          
          boothSubType: {
            id: sub.id,
            name: sub.name,
            type: sub.type,
            slotStart: sub.slotStart,
            slotEnd: sub.slotEnd,
            booth: sub.booth
              ? {
                  id: sub.booth.id,
                  name: sub.booth.name,
                }
              : null,
          },

          boothSubTypeId: sub.id,
          boothSubTypeName: sub.name,
          slotStart: sub.slotStart,
          slotEnd: sub.slotEnd,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch booth status:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching booth status.' },
      { status: 500 }
    );
  }
}
