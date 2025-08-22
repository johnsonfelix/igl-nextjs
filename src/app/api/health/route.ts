import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Prisma healthcheck error:', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
