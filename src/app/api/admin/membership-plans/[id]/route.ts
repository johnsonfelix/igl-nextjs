// app/api/membership-plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET a single membership plan by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const plan = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ message: 'Failed to fetch plan' }, { status: 500 });
  }
}

// PATCH (update) a membership plan by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await request.json();
    const { name, slug, price, features } = data;

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: { name, slug, price, features },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE a membership plan by ID
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.membershipPlan.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ message: 'Failed to delete plan' }, { status: 500 });
  }
}
