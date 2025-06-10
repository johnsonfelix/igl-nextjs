import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        media: true,
        location: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}