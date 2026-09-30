import prisma from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken'; 
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials. User not found.' },
        { status: 401 } 
      );
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    
    const company = await prisma.company.findFirst({
      where: { userId: user.id }
    });

    
    
    
    const payload = {
      userId: user.id,
      companyId: company?.id,
      email: user.email,
    };

    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    
    const accessToken = sign(payload, secret, { expiresIn: '1d' }); 

    
    
    return NextResponse.json({ accessToken });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
