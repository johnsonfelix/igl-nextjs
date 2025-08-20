import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET(
  req: NextRequest,
  // Change 1: The 'params' object is now wrapped in a Promise.
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Change 2: You must 'await' the params to get the resolved object.
    const resolvedParams = await params;

    const inquiry = await prisma.inquiry.findUnique({
      // Change 3: Use the 'id' from the resolved params object.
      where: { id: resolvedParams.id },
      include: {
        company: true,
        responses: {
          include: { responder: true }
        }
      }
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json(inquiry);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
