import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

function extractIds(req: NextRequest): { eventId: string | null; slotId: string | null } {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split('/');
    const meetingsIdx = parts.indexOf('meetings');
    const eventId = meetingsIdx > 0 ? parts[meetingsIdx - 1] : null;
    const slotId = meetingsIdx < parts.length - 1 ? parts[meetingsIdx + 1] : null;
    return { eventId, slotId };
}


export async function DELETE(req: NextRequest) {
    try {
        const { slotId } = extractIds(req);
        if (!slotId) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });

        await prisma.meetingSlot.delete({ where: { id: slotId } });
        return NextResponse.json({ message: 'Meeting slot deleted' });
    } catch (error) {
        console.error('[MEETING_SLOT_DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete meeting slot' }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest) {
    try {
        const { slotId } = extractIds(req);
        if (!slotId) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });

        const body = await req.json();
        const { sessionId, companyId, companyBId, table } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        
        const session = await prisma.meetingSession.findFirst({
            where: { id: sessionId, meetingSlotId: slotId },
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found in this slot' }, { status: 404 });
        }

        
        const updateData: any = {};
        if ('companyId' in body) updateData.companyId = companyId || null;
        if ('companyBId' in body) updateData.companyBId = companyBId || null;
        if ('table' in body) updateData.table = table || null;

        const updated = await prisma.meetingSession.update({
            where: { id: sessionId },
            data: updateData,
            include: {
                company: { select: { id: true, name: true, logoUrl: true } },
                companyB: { select: { id: true, name: true, logoUrl: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[MEETING_SESSION_PATCH]', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}


export async function PUT(req: NextRequest) {
    try {
        const { slotId } = extractIds(req);
        if (!slotId) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });

        const body = await req.json();
        const { sessions: newSessionCount } = body;

        if (!newSessionCount || newSessionCount < 1) {
            return NextResponse.json({ error: 'sessions must be >= 1' }, { status: 400 });
        }

        
        const slot = await prisma.meetingSlot.findUnique({
            where: { id: slotId },
            include: {
                meetingSessions: { orderBy: { sessionIndex: 'asc' } },
            },
        });

        if (!slot) {
            return NextResponse.json({ error: 'Meeting slot not found' }, { status: 404 });
        }

        const currentCount = slot.meetingSessions.length;
        const start = slot.startTime.getTime();
        const end = slot.endTime.getTime();
        const sessionDurationMs = (end - start) / newSessionCount;

        await prisma.$transaction(async (tx) => {
            
            if (newSessionCount < currentCount) {
                const sessionsToDelete = slot.meetingSessions.slice(newSessionCount);
                await tx.meetingSession.deleteMany({
                    where: { id: { in: sessionsToDelete.map((s) => s.id) } },
                });
            }

            
            if (newSessionCount > currentCount) {
                const newSessions = Array.from(
                    { length: newSessionCount - currentCount },
                    (_, i) => {
                        const idx = currentCount + i;
                        return {
                            meetingSlotId: slotId,
                            sessionIndex: idx,
                            startTime: new Date(start + idx * sessionDurationMs),
                            endTime: new Date(start + (idx + 1) * sessionDurationMs),
                        };
                    }
                );
                await tx.meetingSession.createMany({ data: newSessions });
            }

            
            const remainingCount = Math.min(currentCount, newSessionCount);
            for (let i = 0; i < remainingCount; i++) {
                await tx.meetingSession.update({
                    where: { id: slot.meetingSessions[i].id },
                    data: {
                        sessionIndex: i,
                        startTime: new Date(start + i * sessionDurationMs),
                        endTime: new Date(start + (i + 1) * sessionDurationMs),
                    },
                });
            }

            
            await tx.meetingSlot.update({
                where: { id: slotId },
                data: { sessions: newSessionCount },
            });
        });

        
        const updatedSlot = await prisma.meetingSlot.findUnique({
            where: { id: slotId },
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

        return NextResponse.json(updatedSlot);
    } catch (error) {
        console.error('[MEETING_SLOT_PUT]', error);
        return NextResponse.json({ error: 'Failed to update meeting slot' }, { status: 500 });
    }
}
