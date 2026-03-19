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
        console.error("Error fetching past event (public):", error);
        return NextResponse.json(
            { error: "Failed to fetch past event" },
            { status: 500 }
        );
    }
}
