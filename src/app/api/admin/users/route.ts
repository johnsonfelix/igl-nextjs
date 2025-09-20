// /app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
export async function GET(req: Request) {
  try {
    // you can add query params for pagination / search later
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { companies: true }, // include related companies
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/admin/users error', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
