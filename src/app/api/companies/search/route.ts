
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

type CompanyStatus = 'LIVE' | 'BLOCKLISTED' | 'SUSPENDED';

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

    
    const statusParam = (params.get('status') || '').toUpperCase(); // 'ALL' or ''
    const statusesCsv = params.get('statuses'); 
    const includeInactive = params.get('includeInactive') === '1';  

    
    const sortByRegistration = params.get('newlyRegistered') === 'true' || params.get('sortByRegistration') === 'true';

    
    const where: any = {};

    
    

    
    if (statusParam === 'ALL') {
      
    } else if (statusesCsv) {
      const list = statusesCsv
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean) as CompanyStatus[];
      if (list.length > 0) {
        where.status = { in: list };
      }
    } else {
      
      where.status = 'LIVE';
    }

    
    if (!includeInactive) {
      where.isActive = true;
    }

    if (companyName) where.name = { contains: companyName, mode: 'insensitive' };
    if (memberId) where.memberId = { contains: memberId, mode: 'insensitive' };
    if (memberType) where.memberType = { equals: memberType, mode: 'insensitive' };

    
    const locationWhere: any = {};
    if (country && country !== 'All') locationWhere.country = { equals: country, mode: 'insensitive' };
    if (city) locationWhere.city = { contains: city, mode: 'insensitive' };
    if (port) locationWhere.port = { contains: port, mode: 'insensitive' };

    
    const [total, companies] = await prisma.$transaction([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        include: { location: true, media: true, membershipPlan: true }, 
        skip: offset,
        take: limit,
        orderBy: (() => {
          
          if (sortByRegistration) {
            return { createdAt: 'desc' };
          }

          const sort = params.get('sort');
          const ord = (params.get('order') ?? 'asc').toLowerCase();
          const direction = ord === 'desc' ? 'desc' : 'asc';

          if (sort === 'memberFromYear') {
            return { memberFromYear: direction };
          }
          return { name: 'asc' };
        })(),
      }),
    ]);

    return NextResponse.json({
      data: companies,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('API /api/companies/search error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
