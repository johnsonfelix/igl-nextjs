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
