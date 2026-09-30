import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

function extractRequestId(req: NextRequest): string | null {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
}


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
            
            const sessions = meetingRequest.meetingSlot?.meetingSessions || [];
            const openSession = sessions.find(s => !s.companyId || !s.companyBId);

            if (!openSession) {
                return NextResponse.json(
                    { error: 'This time slot is already fully booked' },
                    { status: 409 }
                );
            }

            
            let updateData: any = {};
            if (!openSession.companyId && !openSession.companyBId) {
                
                updateData = {
                    companyId: meetingRequest.fromCompanyId,
                    companyBId: meetingRequest.toCompanyId,
                };
            } else if (!openSession.companyId) {
                
                updateData = { companyId: meetingRequest.fromCompanyId };
            } else if (!openSession.companyBId) {
                
                updateData = { companyBId: meetingRequest.toCompanyId };
            }

            
            if (!openSession.table) {
                updateData.table = `T${openSession.sessionIndex + 1}`;
            }

            
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
