// app/api/inquiries/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma' // Your Prisma client import

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 })
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    })
    
    const formattedInquiries = inquiries.map((inq) => ({
      ...inq,
      companyName: inq.company?.name,
    }));

    return NextResponse.json(formattedInquiries)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
