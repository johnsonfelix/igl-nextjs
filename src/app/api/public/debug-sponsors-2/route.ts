
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                purchaseOrders: {
                    include: {
                        company: true,
                        items: true
                    }
                }
            }
        });

        if (!event) return NextResponse.json({ error: "Event not found" });

        const acceptedSponsors = event.purchaseOrders
            .filter(po => po.status === 'COMPLETED' && po.items.some(i => i.productType === 'SPONSOR'))
            .map(po => ({
                companyName: po.company.name,
                items: po.items.map(i => i.name)
            }));

        return NextResponse.json({ acceptedSponsors, timestamp: Date.now() });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
