// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies(); // synchronous
    const userId = (await cookieStore).get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Vary': 'Cookie',
          },
        }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Vary': 'Cookie',
          },
        }
      );
    }

    const company = await prisma.company.findFirst({ where: { userId: user.id } });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: company?.id ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Vary': 'Cookie',
        },
      }
    );
  } catch (err) {
    console.error('API /me error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Vary': 'Cookie',
        },
      }
    );
  }
}
