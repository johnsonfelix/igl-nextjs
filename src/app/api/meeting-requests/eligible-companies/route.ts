import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { DUMMY_COMPANY_NAMES } from '@/lib/constants';

// GET /api/meeting-requests/eligible-companies?eventId=...&excludeCompanyId=...
// Returns companies that have a COMPLETED purchase order
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const excludeCompanyId = searchParams.get('excludeCompanyId');

        // Find all companies that have at least one COMPLETED purchase order
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                status: 'COMPLETED',
                ...(excludeCompanyId ? { NOT: { companyId: excludeCompanyId } } : {}),
            },
            select: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                    },
                },
            },
        });

        // Deduplicate companies (a company might have multiple orders)
        const companyMap = new Map<string, { id: string; name: string; logoUrl: string | null }>();
        for (const order of orders) {
            if (!companyMap.has(order.company.id)) {
                companyMap.set(order.company.id, order.company);
            }
        }

        // Force include specific dummy/extra companies
        const dummyNames = DUMMY_COMPANY_NAMES;

        const dummyCompanies = await prisma.company.findMany({
            where: {
                OR: dummyNames.map(name => ({
                    name: { contains: name.trim(), mode: 'insensitive' }
                })),
                ...(excludeCompanyId ? { NOT: { id: excludeCompanyId } } : {}),
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
            }
        });

        for (const company of dummyCompanies) {
            if (!companyMap.has(company.id)) {
                companyMap.set(company.id, company);
            }
        }

        const companies = Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(companies);
    } catch (error) {
        console.error('[ELIGIBLE_COMPANIES_GET]', error);
        return NextResponse.json({ error: 'Failed to fetch eligible companies' }, { status: 500 });
    }
}
