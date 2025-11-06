// app/api/companies/search/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

type CompanyStatus = 'LIVE' | 'BLOCKLISTED' | 'SUSPENDED';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // --- query params from client ---
    const companyName = params.get('name') ?? undefined;       // matches frontend
    const memberId = params.get('memberId') ?? undefined;
    const memberType = params.get('memberType') ?? undefined;
    const country = params.get('country') ?? undefined;
    const city = params.get('city') ?? undefined;
    const port = params.get('port') ?? undefined;

    const limit = Math.min(100, Number(params.get('limit') ?? '25'));
    const offset = Math.max(0, Number(params.get('offset') ?? '0'));

    // NEW: Status controls
    // - status=ALL            -> no status filter (return all)
    // - statuses=LIVE,BLOCKLISTED (CSV) -> filter to provided list
    // - (default)             -> LIVE only (backwards compatible)
    const statusParam = (params.get('status') || '').toUpperCase(); // 'ALL' or ''
    const statusesCsv = params.get('statuses'); // e.g. "LIVE,BLOCKLISTED"
    const includeInactive = params.get('includeInactive') === '1';  // if true, don't filter isActive=true

    // ------------------ build where ------------------
    const where: any = {};

    // Status filter
    if (statusParam === 'ALL') {
      // no status filter
    } else if (statusesCsv) {
      const list = statusesCsv
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean) as CompanyStatus[];
      if (list.length > 0) {
        where.status = { in: list };
      }
    } else {
      // default behavior: LIVE only
      where.status = 'LIVE';
    }

    // isActive filter (default: only active; unless includeInactive=1)
    if (!includeInactive) {
      where.isActive = true;
    }

    if (companyName) where.name = { contains: companyName, mode: 'insensitive' };
    if (memberId) where.memberId = { contains: memberId, mode: 'insensitive' };
    if (memberType) where.memberType = { equals: memberType, mode: 'insensitive' };

    // location filters
    const locationWhere: any = {};
    if (country && country !== 'All') locationWhere.country = { equals: country, mode: 'insensitive' };
    if (city) locationWhere.city = { contains: city, mode: 'insensitive' };
    if (port) locationWhere.port = { contains: port, mode: 'insensitive' };

    let companies;

    // Try one-to-one "location" first, then fallback to hypothetical one-to-many "locations"
    if (Object.keys(locationWhere).length > 0) {
      try {
        companies = await prisma.company.findMany({
          where: { ...where, location: locationWhere },
          include: { location: true, media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      } catch (errOne) {
        try {
          companies = await prisma.company.findMany({
            where: { ...where, locations: { some: locationWhere } }, // if you have a one-to-many relation
            include: { media: true }, // adjust if you also want to include locations
            skip: offset,
            take: limit,
            orderBy: { name: 'asc' },
          });
        } catch (errMany) {
          console.warn('Both location strategies failed, falling back to company-only query.', { errOne, errMany });
          companies = await prisma.company.findMany({
            where,
            include: { media: true },
            skip: offset,
            take: limit,
            orderBy: { name: 'asc' },
          });
        }
      }
    } else {
      try {
        companies = await prisma.company.findMany({
          where,
          include: { location: true, media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      } catch {
        companies = await prisma.company.findMany({
          where,
          include: { media: true },
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        });
      }
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error('API /api/companies/search error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
