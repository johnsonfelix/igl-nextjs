import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET single testimonial
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const testimonial = await prisma.testimonial.findUnique({
            where: { id },
        });

        if (!testimonial) {
            return NextResponse.json(
                { error: "Testimonial not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error fetching testimonial:", error);
        return NextResponse.json(
            { error: "Failed to fetch testimonial" },
            { status: 500 }
        );
    }
}

// PUT update testimonial
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, role, description, rating, image, isActive } = body;

        const testimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(role !== undefined && { role }),
                ...(description !== undefined && { description }),
                ...(rating !== undefined && { rating }),
                ...(image !== undefined && { image }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error updating testimonial:", error);
        return NextResponse.json(
            { error: "Failed to update testimonial" },
            { status: 500 }
        );
    }
}

// DELETE testimonial
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.testimonial.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        return NextResponse.json(
            { error: "Failed to delete testimonial" },
            { status: 500 }
        );
    }
}
