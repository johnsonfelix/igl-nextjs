
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
export async function GET(req: Request) {
  try {
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { companies: true }, 
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/admin/users error', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
