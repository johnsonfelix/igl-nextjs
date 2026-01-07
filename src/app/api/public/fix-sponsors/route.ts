
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { eventSponsorTypes: { include: { sponsorType: true } } }
        });

        if (!event) return NextResponse.json({ error: "Event not found" });

        const names = event.eventSponsorTypes.map(est => est.sponsorType.name);

        const websiteSponsor = event.eventSponsorTypes.find(est =>
            est.sponsorType.name.toLowerCase().includes('website')
        );

        if (websiteSponsor) {
            // Perform delete only if confirmed, but for now let's just see names
            // await prisma.eventSponsorType.delete(...)
            return NextResponse.json({ found: true, name: websiteSponsor.sponsorType.name, all: names });
        }

        return NextResponse.json({ found: false, allSponsors: names });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
