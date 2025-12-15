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

  // JWT Generation
  const { sign } = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';

  const token = sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: company?.id ?? null
    },
    secret,
    { expiresIn: '1d' }
  );

  const res = NextResponse.json(
    {
      success: true,
      userId: user.id,
      role: user.role, // Return role for frontend redirect
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

  // Set userId cookie (keep existing logic)
  res.cookies.set('userId', String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Set JWT cookie
  res.cookies.set('jwt_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  if (company?.id) {
    res.cookies.set('companyId', String(company.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return res;
}
