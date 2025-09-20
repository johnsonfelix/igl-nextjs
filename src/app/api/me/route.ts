import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
  // --- THIS IS THE FIX ---
  // Await the cookies() function to get the actual cookie store
  const cookieStore = await cookies();
  // --- END OF FIX ---
  
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const company = await prisma.company.findFirst({
      where: { userId: user.id },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: company?.id,
    });
    
  } catch (error) {
    console.error("API /me error:", error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
