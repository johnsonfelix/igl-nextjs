import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { DUMMY_COMPANY_NAMES } from '@/lib/constants';



export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const excludeCompanyId = searchParams.get('excludeCompanyId');

        
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
                        location: { select: { city: true, country: true } },
                    },
                },
            },
        });

        
        const companyMap = new Map<string, { id: string; name: string; logoUrl: string | null; location?: { city: string; country: string } | null }>();
        for (const order of orders) {
            if (!companyMap.has(order.company.id)) {
                companyMap.set(order.company.id, order.company);
            }
        }

        
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
                location: { select: { city: true, country: true } },
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
