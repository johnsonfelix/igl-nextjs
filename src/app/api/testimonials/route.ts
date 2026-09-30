import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";


export async function GET() {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(testimonials);
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return NextResponse.json(
            { error: "Failed to fetch testimonials" },
            { status: 500 }
        );
    }
}
