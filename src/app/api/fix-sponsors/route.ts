
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { eventSponsorTypes: { include: { sponsorType: true } } }
        });

        if (!event) return NextResponse.json({ error: "Event not found" });

        const websiteSponsor = event.eventSponsorTypes.find(est =>
            est.sponsorType.name.toLowerCase().includes('website')
        );

        if (websiteSponsor) {
            await prisma.eventSponsorType.delete({
                where: {
                    eventId_sponsorTypeId: {
                        eventId: eventId,
                        sponsorTypeId: websiteSponsor.sponsorTypeId
                    }
                }
            });
            return NextResponse.json({ success: true, message: `Removed ${websiteSponsor.sponsorType.name}` });
        }

        return NextResponse.json({ success: false, message: "No Website sponsor found" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
