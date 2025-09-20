// app/api/admin/companies/flagged/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const companyName = params.get('name') ?? undefined;
    const memberId = params.get('memberId') ?? undefined;
    const memberType = params.get('memberType') ?? undefined;
    const country = params.get('country') ?? undefined;
    const city = params.get('city') ?? undefined;
    const port = params.get('port') ?? undefined;

    const limit = Math.min(100, Number(params.get('limit') ?? '25'));
    const offset = Math.max(0, Number(params.get('offset') ?? '0'));

    // Base company filters
    const baseWhere: any = {};
    // show only SUSPENDED or BLOCKLISTED companies
    baseWhere.status = { in: ['SUSPENDED', 'BLOCKLISTED'] };

    if (companyName) baseWhere.name = { contains: companyName, mode: 'insensitive' };
    if (memberId) baseWhere.memberId = memberId;
    if (memberType) baseWhere.memberType = memberType;

    // Location filters
    const locationWhere: any = {};
    if (country && country !== 'All') locationWhere.country = { equals: country, mode: 'insensitive' };
    if (city) locationWhere.city = { contains: city, mode: 'insensitive' };
    if (port) locationWhere.port = { contains: port, mode: 'insensitive' };

    let companies;

    if (Object.keys(locationWhere).length > 0) {
      try {
        // If company has a single 'location' relation
        companies = await prisma.company.findMany({
          where: { ...baseWhere, location: locationWhere },
          include: { location: true, media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      } catch (errOne) {
        try {
          // Fallback to one-to-many 'locations' relation
          companies = await prisma.company.findMany({
            where: { ...baseWhere, locations: { some: locationWhere } },
            include: { media: true },
            skip: offset,
            take: limit,
            orderBy: { name: 'asc' },
          });
        } catch (errMany) {
          console.warn('Both location strategies failed, falling back to company-only query.', { errOne, errMany });
          companies = await prisma.company.findMany({
            where: baseWhere,
            include: { media: true },
            skip: offset,
            take: limit,
            orderBy: { name: 'asc' },
          });
        }
      }
    } else {
      // No location filters
      try {
        companies = await prisma.company.findMany({
          where: baseWhere,
          include: { location: true, media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      } catch (err) {
        // Fallback if 'location' relation doesn't exist
        companies = await prisma.company.findMany({
          where: baseWhere,
          include: { media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      }
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error('API /api/admin/companies/flagged error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
