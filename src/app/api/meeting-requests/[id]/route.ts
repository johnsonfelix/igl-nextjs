import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

function extractRequestId(req: NextRequest): string | null {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
}

// PATCH /api/meeting-requests/[id] — accept or decline a meeting request
export async function PATCH(req: NextRequest) {
    try {
        const requestId = extractRequestId(req);
        if (!requestId) return NextResponse.json({ error: 'Request ID required' }, { status: 400 });

        const body = await req.json();
        const { status, declineReason } = body;

        if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
            return NextResponse.json(
                { error: 'status must be ACCEPTED or DECLINED' },
                { status: 400 }
            );
        }

        const meetingRequest = await prisma.meetingRequest.findUnique({
            where: { id: requestId },
            include: { 
                meetingSlot: {
                    include: { meetingSessions: true }
                }
            },
        });

        if (!meetingRequest) {
            return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 });
        }

        if (meetingRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This request has already been processed' },
                { status: 409 }
            );
        }

        if (status === 'ACCEPTED') {
            // Find an open session in the slot
            const sessions = meetingRequest.meetingSlot?.meetingSessions || [];
            const openSession = sessions.find(s => !s.companyId || !s.companyBId);

            if (!openSession) {
                return NextResponse.json(
                    { error: 'This time slot is already fully booked' },
                    { status: 409 }
                );
            }

            // Determine which slots are free in the session
            let updateData: any = {};
            if (!openSession.companyId && !openSession.companyBId) {
                // Both slots free — assign fromCompany to A, toCompany to B
                updateData = {
                    companyId: meetingRequest.fromCompanyId,
                    companyBId: meetingRequest.toCompanyId,
                };
            } else if (!openSession.companyId) {
                // Slot A free
                updateData = { companyId: meetingRequest.fromCompanyId };
            } else if (!openSession.companyBId) {
                // Slot B free
                updateData = { companyBId: meetingRequest.toCompanyId };
            }

            // Assign table number based on session index if not already assigned
            if (!openSession.table) {
                updateData.table = `T${openSession.sessionIndex + 1}`;
            }

            // Update session and request in a transaction
            await prisma.$transaction([
                prisma.meetingSession.update({
                    where: { id: openSession.id },
                    data: updateData,
                }),
                prisma.meetingRequest.update({
                    where: { id: requestId },
                    data: { status: 'ACCEPTED' },
                }),
            ]);
        } else {
            // Just decline
            await prisma.meetingRequest.update({
                where: { id: requestId },
                data: { status: 'DECLINED', declineReason: declineReason || null },
            });
        }

        const updated = await prisma.meetingRequest.findUnique({
            where: { id: requestId },
            include: {
                fromCompany: { select: { id: true, name: true, logoUrl: true } },
                toCompany: { select: { id: true, name: true, logoUrl: true } },
                event: { select: { id: true, name: true } },
                meetingSlot: { select: { title: true, startTime: true, endTime: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[MEETING_REQUEST_PATCH]', error);
        return NextResponse.json({ error: 'Failed to update meeting request' }, { status: 500 });
    }
}

// DELETE /api/meeting-requests/[id] — cancel a pending meeting request
export async function DELETE(req: NextRequest) {
    try {
        const requestId = extractRequestId(req);
        if (!requestId) return NextResponse.json({ error: 'Request ID required' }, { status: 400 });

        const meetingRequest = await prisma.meetingRequest.findUnique({
            where: { id: requestId },
        });

        if (!meetingRequest) {
            return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 });
        }

        if (meetingRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Only pending requests can be cancelled' },
                { status: 400 }
            );
        }

        await prisma.meetingRequest.delete({
            where: { id: requestId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MEETING_REQUEST_DELETE]', error);
        return NextResponse.json({ error: 'Failed to cancel meeting request' }, { status: 500 });
    }
}
