import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

function extractEventId(req: NextRequest): string | null {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split('/');
    const meetingsIdx = parts.indexOf('meetings');
    if (meetingsIdx > 0) return parts[meetingsIdx - 1];
    return null;
}

// GET /api/events/[id]/meetings — list all meeting slots with sessions
export async function GET(req: NextRequest) {
    try {
        const eventId = extractEventId(req);
        if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        const slots = await prisma.meetingSlot.findMany({
            where: { eventId },
            include: {
                meetingSessions: {
                    include: {
                        company: { select: { id: true, name: true, logoUrl: true } },
                        companyB: { select: { id: true, name: true, logoUrl: true } },
                    },
                    orderBy: { sessionIndex: 'asc' },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        return NextResponse.json(slots);
    } catch (error) {
        console.error('[MEETINGS_GET]', error);
        return NextResponse.json({ error: 'Failed to fetch meeting slots' }, { status: 500 });
    }
}

// POST /api/events/[id]/meetings — create a meeting slot with sessions
export async function POST(req: NextRequest) {
    try {
        const eventId = extractEventId(req);
        if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        const body = await req.json();
        const { title, startTime, endTime, sessions } = body;

        if (!startTime || !endTime || !sessions || sessions < 1) {
            return NextResponse.json({ error: 'startTime, endTime, and sessions (>=1) are required' }, { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        const totalMs = end.getTime() - start.getTime();
        const sessionDurationMs = totalMs / sessions;

        // Create the slot and its sessions in a transaction
        const slot = await prisma.meetingSlot.create({
            data: {
                eventId,
                title: title || 'One-to-One Meeting',
                startTime: start,
                endTime: end,
                sessions,
                meetingSessions: {
                    create: Array.from({ length: sessions }, (_, i) => ({
                        sessionIndex: i,
                        startTime: new Date(start.getTime() + i * sessionDurationMs),
                        endTime: new Date(start.getTime() + (i + 1) * sessionDurationMs),
                    })),
                },
            },
            include: {
                meetingSessions: {
                    include: {
                        company: { select: { id: true, name: true, logoUrl: true } },
                        companyB: { select: { id: true, name: true, logoUrl: true } },
                    },
                    orderBy: { sessionIndex: 'asc' },
                },
            },
        });

        return NextResponse.json(slot);
    } catch (error) {
        console.error('[MEETINGS_POST]', error);
        return NextResponse.json({ error: 'Failed to create meeting slot' }, { status: 500 });
    }
}
