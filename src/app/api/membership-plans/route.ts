import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const plans = await prisma.membershipPlan.findMany({
            orderBy: { price: 'asc' }, // or name
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Failed to fetch membership plans:', error);
        return NextResponse.json({ error: 'Failed to fetch membership plans' }, { status: 500 });
    }
}
