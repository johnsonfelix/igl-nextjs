import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
    try {
        const events = await prisma.pastEvent.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching past events:", error);
        return NextResponse.json(
            { error: "Failed to fetch past events" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, place, date, membersAttended, description, mainImage, carouselImages } = body;

        // Basic validation
        if (!title || !place || !date || !membersAttended || !description || !mainImage) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const event = await prisma.pastEvent.create({
            data: {
                title,
                place,
                date,
                membersAttended: parseInt(membersAttended.toString()),
                description,
                mainImage,
                carouselImages: carouselImages || [],
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating past event:", error);
        return NextResponse.json(
            { error: "Failed to create past event" },
            { status: 500 }
        );
    }
}
