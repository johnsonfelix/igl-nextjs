// app/api/company/login/route.ts
import prisma from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const isMatch = await compare(password, user.password);
  if (!isMatch) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });

  const company = await prisma.company.findFirst({ where: { userId: user.id } });

  const res = NextResponse.json(
    {
      success: true,
      userId: user.id,
      company: company?.id ?? null,
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

  res.cookies.set('userId', user.id, {
    httpOnly: true,
    secure: true,      // HTTPS on Amplify
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
