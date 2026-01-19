import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET all testimonials (admin)
export async function GET() {
    try {
        const testimonials = await prisma.testimonial.findMany({
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

// POST create new testimonial
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, role, description, rating, image, isActive } = body;

        if (!name || !role || !description) {
            return NextResponse.json(
                { error: "Name, role, and description are required" },
                { status: 400 }
            );
        }

        const testimonial = await prisma.testimonial.create({
            data: {
                name,
                role,
                description,
                rating: rating || 5,
                image: image || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(testimonial, { status: 201 });
    } catch (error) {
        console.error("Error creating testimonial:", error);
        return NextResponse.json(
            { error: "Failed to create testimonial" },
            { status: 500 }
        );
    }
}
