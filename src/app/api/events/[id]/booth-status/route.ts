import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/events/[id]/booth-status
 * Fetches ONLY the purchased booth seats for a specific event and returns a
 * simple list containing the booth details and the buyer's company name.
 */
export async function GET(
  request: Request,
  // Change 1: The 'params' object is now wrapped in a Promise.
  context: { params: Promise<{ id: string }> }
) {
  // Change 2: You must 'await' the context.params to access the 'id'.
  const { id: eventId } = await context.params;

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    // We only need the items that have been purchased.
    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          eventId: eventId,
        },
        productType: 'BOOTH',
        boothSubTypeId: { not: null },
      },
      select: {
        // We select only the necessary fields for the response
        name: true, // This is the combined name like "Category - Seat"
        order: {
          select: {
            company: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc', // Sort alphabetically by booth name
      }
    });

    // Transform the data into the desired flat structure
    const result = purchasedItems
      .map(item => {
        // Ensure company and its name exist to avoid errors
        if (item.order.company?.name) {
          return {
            boothName: item.name, // e.g., "Premium Booth - A1"
            companyName: item.order.company.name,
          };
        }
        return null;
      })
      .filter(Boolean); // Filter out any null entries

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch booth status:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching booth status.' },
      { status: 500 }
    );
  }
}
