import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/meeting-requests/blocked-slots?companyId=...&eventId=...
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const eventId = searchParams.get('eventId');

        if (!companyId || !eventId) {
            return NextResponse.json({ error: 'companyId and eventId are required' }, { status: 400 });
        }

        const blockedSlots = await prisma.blockedMeetingSlot.findMany({
            where: {
                companyId,
                eventId,
            },
            select: {
                meetingSlotId: true,
            },
        });

        return NextResponse.json(blockedSlots.map(bs => bs.meetingSlotId));
    } catch (error) {
        console.error('[BLOCKED_SLOTS_GET]', error);
        return NextResponse.json({ error: 'Failed to fetch blocked slots' }, { status: 500 });
    }
}

// POST /api/meeting-requests/blocked-slots
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyId, eventId, meetingSlotIds } = body;

        if (!companyId || !eventId || !Array.isArray(meetingSlotIds)) {
            return NextResponse.json({ error: 'companyId, eventId, and an array of meetingSlotIds are required' }, { status: 400 });
        }

        // We'll use a transaction to delete existing blocked slots for this company/event
        // and insert the new ones.
        await prisma.$transaction(async (tx) => {
            // Remove existing blocked slots for this company and event
            await tx.blockedMeetingSlot.deleteMany({
                where: {
                    companyId,
                    eventId,
                },
            });

            // Insert new blocked slots
            if (meetingSlotIds.length > 0) {
                await tx.blockedMeetingSlot.createMany({
                    data: meetingSlotIds.map((slotId: string) => ({
                        companyId,
                        eventId,
                        meetingSlotId: slotId,
                    })),
                    skipDuplicates: true,
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[BLOCKED_SLOTS_POST]', error);
        return NextResponse.json({ error: 'Failed to update blocked slots' }, { status: 500 });
    }
}
