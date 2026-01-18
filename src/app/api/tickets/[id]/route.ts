import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET one ticket (Public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("[PUBLIC_TICKET_GET]", error);
        return NextResponse.json(
            { error: "Failed to fetch ticket" },
            { status: 500 }
        );
    }
}
