
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                eventSponsorTypes: { include: { sponsorType: true } },
                booths: true
            }
        });

        if (!event) return NextResponse.json({ error: "Event not found" });

        const sponsors = event.eventSponsorTypes.map(est => est.sponsorType.name);
        const booths = event.booths.map(b => b.name);

        return NextResponse.json({ sponsors, booths });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
