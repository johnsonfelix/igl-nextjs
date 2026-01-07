
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
    try {
        // Find POs with "Website" item
        const pos = await prisma.purchaseOrder.findMany({
            where: {
                eventId: eventId,
                items: {
                    some: {
                        name: 'Website'
                    }
                }
            },
            include: { items: true }
        });

        const deletedIds = [];
        for (const po of pos) {
            await prisma.purchaseOrder.delete({ where: { id: po.id } });
            deletedIds.push(po.id);
        }

        return NextResponse.json({ success: true, deletedCount: deletedIds.length, deletedIds });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
