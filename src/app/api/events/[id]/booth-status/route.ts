import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/events/[id]/booth-status
 * Uses OrderItem.boothSubTypeId (no Prisma relation) to fetch BoothSubType
 * and returns company + subtype date/time for Flutter.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await context.params;

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    // 1) Fetch all BOOTH order items with a non-null boothSubTypeId for this event
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

    // 2) Collect unique boothSubTypeIds
    const subtypeIds = Array.from(
      new Set(
        items
          .map((i) => i.boothSubTypeId)
          .filter((id): id is string => !!id)
      )
    );

    if (subtypeIds.length === 0) {
      // Nothing to match, so nothing to show
      return NextResponse.json([], { status: 200 });
    }

    // 3) Fetch BoothSubType rows for those ids
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

    // 4) Build a map: subtypeId -> subtype
    const subtypeMap = new Map<string, (typeof subTypes)[number]>();
    for (const st of subTypes) {
      subtypeMap.set(st.id, st);
    }

    // 5) Join items + subtypes and build response
    const result = items
      .map((item) => {
        const subTypeId = item.boothSubTypeId;
        if (!subTypeId) return null;

        const sub = subtypeMap.get(subTypeId);
        const companyName = item.order.company?.name;

        // If no subtype or no company, we skip (as you requested)
        if (!sub || !companyName) return null;

        return {
          // For older UI compatibility
          boothName: item.name,
          companyName,

          // ✅ For Flutter BoothStatusScreen (you already read these keys)
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
