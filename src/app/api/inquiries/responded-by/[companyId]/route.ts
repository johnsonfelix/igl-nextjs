import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma'; 


export async function GET(
  request: Request,
  
  context: { params: Promise<{ companyId: string }> }
) {
  
  const { companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json(
      { error: 'Responder Company ID is required' },
      { status: 400 }
    );
  }

  try {
    
    const responses = await prisma.inquiryResponse.findMany({
      where: {
        responderId: companyId,
      },
      orderBy: {
        createdAt: 'desc', 
      },
      
      include: {
        inquiry: {
          select: { 
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
