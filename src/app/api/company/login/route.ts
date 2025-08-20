import prisma from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const isMatch = await compare(password, user.password);

  if (!isMatch) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  // Fetch this user's company
  const company = await prisma.company.findFirst({
    where: { userId: user.id }
  });

  const companyId = company?.id;

  // Save session with cookies (basic example)
  const nextResponse = NextResponse.json({
    success: true,
    userId: user.id,
    companyId, // here!
  });
  nextResponse.cookies.set('userId', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return nextResponse;
}
