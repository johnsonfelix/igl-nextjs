
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import type { Prisma } from '@prisma/client';

type Body = {
  status?: 'LIVE' | 'BLOCKLISTED' | 'SUSPENDED';
};

export async function PATCH(req: Request, context: any) {
  const rawId = context?.params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) return NextResponse.json({ error: 'Missing company id' }, { status: 400 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = ['LIVE', 'BLOCKLISTED', 'SUSPENDED'];
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` }, { status: 400 });
  }

  
  
  
  const whereClause: Prisma.CompanyWhereUniqueInput = isNaN(Number(id))
    ? { id: id as string }           
    : ({ id: Number(id) } as any);   

  try {
    const updated = await prisma.company.update({
      where: whereClause,
      
      data: {
        status: body.status,
      },
      select: {
        id: true,
        status: true,
        isActive: true,
        isVerified: true,
        memberType: true,
        logoUrl: true,
        location: true,
        media: true,
        name: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    console.error('Error updating company status', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
