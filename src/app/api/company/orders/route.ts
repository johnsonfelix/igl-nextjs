
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check for company
        const company = await prisma.company.findFirst({ where: { userId: user.id } });
        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Use company.id for the query
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                companyId: company.id,
            },
            include: {
                items: true,
                event: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        location: true,
                    }
                },
                coupon: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(orders);
    } catch (error: any) {
        console.error("Error fetching company orders:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
