

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma'; 


export async function GET(
  request: Request,
  
  context: { params: Promise<{ id: string }> }
) {
  
  const { id: companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        memberId: true, 
        name: true, 
        memberType: true, 
        website: true, 
        location: { 
          select: {
            city: true,
            country: true,
          }
        },
        user: { 
          select: {
            name: true,
          }
        },
        media: {
          where: { type: 'LOGO' },
          select: { url: true },
          take: 1, 
        }
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    
    const badgeDetails = {
      companyId: company.id,
      memberId: company.memberId,
      companyName: company.name,
      personName: company.user?.name || 'N/A', 
      designation: company.memberType || 'N/A', 
      companyLogoUrl: company.media?.[0]?.url || null, 
      country: company.location?.country || null,
      city: company.location?.city || null,
      profileImageUrl: null, 
    };

    return NextResponse.json(badgeDetails, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch badge details:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching badge details.' },
      { status: 500 }
    );
  }
}
