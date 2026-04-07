import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const reviews = await prisma.eventReview.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { reviewerName, companyName, rating, feedback } = body;

    if (!reviewerName || !companyName) {
      return NextResponse.json(
        { error: 'Name and Company Name are required' },
        { status: 400 }
      );
    }

    const review = await prisma.eventReview.create({
      data: {
        eventId,
        reviewerName,
        companyName,
        rating: typeof rating === 'number' ? rating : 5,
        feedback: feedback || '',
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
