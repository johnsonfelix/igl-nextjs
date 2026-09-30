import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET(
  req: NextRequest,
  
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const resolvedParams = await params;

    const inquiry = await prisma.inquiry.findUnique({
      
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
