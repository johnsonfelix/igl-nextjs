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
      select: {
        id: true,
        from: true,
        to: true,
        cargoType: true,
        commodity: true,
        shipmentMode: true,
        remark: true,
        createdAt: true
      }
    })
    return NextResponse.json(inquiries)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
