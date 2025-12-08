// app/api/membership-plans/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET all membership plans
export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
      },
    });

    return NextResponse.json(plans);
  } catch (err) {
    console.error("GET /api/admin/membership-plans error:", err);
    return NextResponse.json(
      { error: "Failed to fetch membership plans" },
      { status: 500 }
    );
  }
}

// POST a new membership plan
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, slug, price, description, thumbnail, features } = data;

    // Basic validation
    if (!name || typeof price !== 'number' || !Array.isArray(features)) {
        return NextResponse.json({ message: 'Invalid data provided' }, { status: 400 });
    }

    const newPlan = await prisma.membershipPlan.create({
      data: {
        name,
        slug,
        price,
        description,
        thumbnail,
        features,
      },
    });
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating membership plan:", error);
    return NextResponse.json({ message: 'Failed to create plan' }, { status: 500 });
  }
}
