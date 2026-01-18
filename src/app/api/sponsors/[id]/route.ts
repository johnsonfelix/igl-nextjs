import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET one sponsor (Public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const sponsor = await prisma.sponsorType.findUnique({
            where: { id },
        });

        if (!sponsor) {
            return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
        }

        return NextResponse.json(sponsor);
    } catch (error) {
        console.error("[PUBLIC_SPONSOR_GET]", error);
        return NextResponse.json(
            { error: "Failed to fetch sponsor" },
            { status: 500 }
        );
    }
}
