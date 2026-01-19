import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET latest 4 inquiries (public endpoint)
export async function GET() {
    try {
        const inquiries = await prisma.inquiry.findMany({
            take: 4,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                from: true,
                to: true,
                shipmentMode: true,
                cargoType: true,
                createdAt: true,
            },
        });

        return NextResponse.json(inquiries);
    } catch (error) {
        console.error("Error fetching latest inquiries:", error);
        return NextResponse.json(
            { error: "Failed to fetch latest inquiries" },
            { status: 500 }
        );
    }
}
