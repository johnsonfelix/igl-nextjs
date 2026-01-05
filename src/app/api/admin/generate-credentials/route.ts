
import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import { hash } from "bcryptjs";

export async function POST() {
    try {
        // 1. Find all companies that:
        //    - Have no userId (not linked to a user account)
        //    - Have a location with an email address
        const companies = await prisma.company.findMany({
            where: {
                userId: null,
                location: {
                    email: {
                        not: null
                    }
                }
            },
            include: {
                location: true
            }
        });

        const results = {
            totalFound: companies.length,
            created: 0,
            skipped: 0,
            errors: 0,
            details: [] as any[]
        };

        const defaultPassword = "IGLA2026!";
        const hashedPassword = await hash(defaultPassword, 10);

        for (const company of companies) {
            const email = company.location?.email?.trim();

            if (!email) {
                results.skipped++;
                results.details.push({ companyId: company.id, name: company.name, status: "skipped", reason: "No email found" });
                continue;
            }

            try {
                // Check if user already exists
                let user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            email,
                            password: hashedPassword,
                            name: company.name,
                            role: 'USER',
                            isCompleted: true,
                            phone: company.location?.mobile || company.location?.phone || undefined,
                        }
                    });
                }

                // Link company to user
                await prisma.company.update({
                    where: { id: company.id },
                    data: { userId: user.id }
                });

                results.created++;
                results.details.push({ companyId: company.id, email, status: "linked" });

            } catch (err: any) {
                console.error(`Error linking company ${company.name}:`, err);
                results.errors++;
                results.details.push({ companyId: company.id, name: company.name, status: "error", error: err.message });
            }
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error('Generate credentials error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
