import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const event = await prisma.pastEvent.findUnique({
            where: { id },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching past event:", error);
        return NextResponse.json(
            { error: "Failed to fetch past event" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, place, date, membersAttended, description, mainImage, carouselImages } = body;

        const event = await prisma.pastEvent.update({
            where: { id },
            data: {
                title,
                place,
                date,
                membersAttended: membersAttended ? parseInt(membersAttended.toString()) : undefined,
                description,
                mainImage,
                carouselImages,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating past event:", error);
        return NextResponse.json(
            { error: "Failed to update past event" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.pastEvent.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting past event:", error);
        return NextResponse.json(
            { error: "Failed to delete past event" },
            { status: 500 }
        );
    }
}
