// app/api/membership-plans/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET all membership plans
export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: {
        price: 'asc', // Order plans by price
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    return NextResponse.json({ message: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST a new membership plan
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, slug, price, features } = data;

    // Basic validation
    if (!name || !slug || typeof price !== 'number' || !Array.isArray(features)) {
        return NextResponse.json({ message: 'Invalid data provided' }, { status: 400 });
    }

    const newPlan = await prisma.membershipPlan.create({
      data: {
        name,
        slug,
        price,
        features,
      },
    });
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating membership plan:", error);
    return NextResponse.json({ message: 'Failed to create plan' }, { status: 500 });
  }
}
