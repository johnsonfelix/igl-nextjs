import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyId, reason } = body;

        if (!companyId || !reason) {
            return NextResponse.json(
                { error: 'Company ID and Reason are required' },
                { status: 400 }
            );
        }

        const report = await prisma.report.create({
            data: {
                reportedCompanyId: companyId,
                reason,
                status: 'PENDING',
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json(
            { error: 'Failed to submit report', details: String(error) },
            { status: 500 }
        );
    }
}
