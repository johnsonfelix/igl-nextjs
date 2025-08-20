import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma'; // Adjust this path to your prisma client

/**
 * GET /api/inquiries/responded-by/[companyId]
 * Fetches all inquiries that a specific company has responded to.
 */
export async function GET(
  request: Request,
  // Change 1: The 'params' object is now wrapped in a Promise.
  context: { params: Promise<{ companyId: string }> }
) {
  // Change 2: You must 'await' the context.params to access the 'companyId'.
  const { companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json(
      { error: 'Responder Company ID is required' },
      { status: 400 }
    );
  }

  try {
    // We query the InquiryResponse model directly, filtering by the responder's ID
    const responses = await prisma.inquiryResponse.findMany({
      where: {
        responderId: companyId,
      },
      orderBy: {
        createdAt: 'desc', // Show the most recent responses first
      },
      // We include the full details of the original inquiry for each response
      include: {
        inquiry: {
          select: { // Select only the necessary fields from the inquiry
            id: true,
            from: true,
            to: true,
            commodity: true,
            shipmentMode: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ responses });
  } catch (e) {
    console.error(`Failed to fetch responses for company ${companyId}:`, e);
    return NextResponse.json(
      { error: 'Failed to fetch responded inquiries' },
      { status: 500 }
    );
  }
}
