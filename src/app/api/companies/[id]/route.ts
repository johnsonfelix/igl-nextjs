import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathnameParts = url.pathname.split('/');
  const id = pathnameParts[pathnameParts.length - 1];

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
