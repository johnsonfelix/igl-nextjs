import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ message: 'City parameter is required' }, { status: 400 });
  }

  try {
    const companies = await prisma.company.findMany({
      where: {
        location: {
          city: {
            equals: city,
            mode: 'insensitive', // case-insensitive match
          },
        },
      },
      include: {
        location: true,
        services: true,
        certificates: true,
        media: true,
        activities: true,
        partners: true,
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies by city:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
