import prisma from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken'; // Import the 'sign' function
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
        { status: 401 } // Use 401 for consistency
      );
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Fetch this user's company
    const company = await prisma.company.findFirst({
      where: { userId: user.id }
    });

    // --- JWT CREATION ---
    // The "payload" is the data you want to encode in the token.
    // Include any data the client might need, like user ID, roles, etc.
    const payload = {
      userId: user.id,
      companyId: company?.id,
      email: user.email,
    };

    // Get the secret key from environment variables.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    // Create the token. It's now a string.
    const accessToken = sign(payload, secret, { expiresIn: '1d' }); // Token expires in 1 day

    // --- NEW RESPONSE ---
    // Return the token in the format the Flutter app expects.
    return NextResponse.json({ accessToken });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
