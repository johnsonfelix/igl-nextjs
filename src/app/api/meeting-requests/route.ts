import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { sendEmail } from '@/lib/email';
import { DUMMY_COMPANY_NAMES } from '@/lib/constants';

// POST /api/meeting-requests — create a meeting request
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventId, meetingSlotId, fromCompanyId, toCompanyId, message } = body;

        if (!eventId || !meetingSlotId || !fromCompanyId || !toCompanyId) {
            return NextResponse.json(
                { error: 'eventId, meetingSlotId, fromCompanyId, and toCompanyId are required' },
                { status: 400 }
            );
        }

        if (fromCompanyId === toCompanyId) {
            return NextResponse.json({ error: 'Cannot request a meeting with yourself' }, { status: 400 });
        }

        // Verify both companies have a COMPLETED purchase order OR are on the dummy list
        const dummyNames = DUMMY_COMPANY_NAMES;

        const [fromComp, toComp] = await Promise.all([
            prisma.company.findUnique({
                where: { id: fromCompanyId },
                include: {
                    purchaseOrders: {
                        where: { status: 'COMPLETED' }
                    }
                }
            }),
            prisma.company.findUnique({
                where: { id: toCompanyId },
                include: {
                    purchaseOrders: {
                        where: { status: 'COMPLETED' }
                    }
                }
            }),
        ]);

        const isFromEligible = fromComp && (fromComp.purchaseOrders.length > 0 || dummyNames.some((name: string) => fromComp.name.toLowerCase().includes(name.toLowerCase().trim())));
        const isToEligible = toComp && (toComp.purchaseOrders.length > 0 || dummyNames.some((name: string) => toComp.name.toLowerCase().includes(name.toLowerCase().trim())));

        if (!isFromEligible) {
            return NextResponse.json(
                { error: 'Your company is not eligible to request this meeting' },
                { status: 403 }
            );
        }
        if (!isToEligible) {
            return NextResponse.json(
                { error: 'The target company is not eligible for this meeting' },
                { status: 403 }
            );
        }

        // Verify the slot belongs to this event and has available session space
        const slot = await prisma.meetingSlot.findFirst({
            where: {
                id: meetingSlotId,
                eventId,
            },
            include: {
                meetingSessions: true,
            }
        });

        if (!slot) {
            return NextResponse.json({ error: 'Meeting slot not found for this event' }, { status: 404 });
        }

        // Check if the slot as a whole is already fully booked
        // i.e., all sessions have both companyId and companyBId assigned
        const hasOpenSession = slot.meetingSessions.some(session => !session.companyId || !session.companyBId);

        if (!hasOpenSession && slot.meetingSessions.length > 0) {
            return NextResponse.json({ error: 'All sessions in this time slot are already fully booked' }, { status: 409 });
        }

        // Check for existing request
        const existing = await prisma.meetingRequest.findFirst({
            where: {
                meetingSlotId,
                fromCompanyId,
                toCompanyId,
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'A meeting request already exists for this time slot' }, { status: 409 });
        }

        const meetingRequest = await prisma.meetingRequest.create({
            data: {
                eventId,
                meetingSlotId,
                fromCompanyId,
                toCompanyId,
                message: message || null,
            },
            include: {
                fromCompany: { select: { id: true, name: true, logoUrl: true } },
                toCompany: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        location: { select: { email: true } },
                        user: { select: { email: true } }
                    }
                },
                meetingSlot: { select: { title: true, startTime: true, endTime: true } },
                event: { select: { name: true } }
            },
        });

        // Send Email Notification to Target Company
        const toEmail = meetingRequest.toCompany.location?.email || meetingRequest.toCompany.user?.email;

        console.log('[MEETING_REQUEST_POST] Attempting to send email to:', toEmail);
        console.log('Location email:', meetingRequest.toCompany.location?.email);
        console.log('User email:', meetingRequest.toCompany.user?.email);

        if (toEmail) {
            const eventName = meetingRequest.event?.name || 'an upcoming event';
            const sessionTitle = meetingRequest.meetingSlot.title;

            // Format time helper local to block
            const sessionDate = new Date(meetingRequest.meetingSlot.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const fmtTime = (d: Date) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const sTime = fmtTime(meetingRequest.meetingSlot.startTime);
            const eTime = fmtTime(meetingRequest.meetingSlot.endTime);

            try {
                await sendEmail({
                    to: toEmail,
                    subject: `New Meeting Request from ${meetingRequest.fromCompany.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #004aad;">New Meeting Request</h2>
                            <p>Hello ${meetingRequest.toCompany.name},</p>
                            <p><strong>${meetingRequest.fromCompany.name}</strong> has requested a One-to-One meeting with you at <strong>${eventName}</strong>.</p>
                            
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0;"><strong>Slot:</strong> ${sessionTitle}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${sessionDate}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${sTime} - ${eTime}</p>
                                ${meetingRequest.message ? `<p style="margin: 0; padding-top: 10px; border-top: 1px solid #e9ecef;"><strong>Message:</strong> "${meetingRequest.message}"</p>` : ''}
                            </div>

                            <p>Please log in to your dashboard to accept or decline this request.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
                        </div>
                    `
                });
                console.log('[MEETING_REQUEST_POST] Email sent successfully to:', toEmail);
            } catch (err: any) {
                console.error('[EMAIL_SEND_ERROR]', err);
            }
        } else {
            console.log('[MEETING_REQUEST_POST] Skiping email, no toEmail found for target company.');
        }

        return NextResponse.json(meetingRequest);
    } catch (error: any) {
        console.error('[MEETING_REQUEST_POST] Full error:', error);
        console.error('[MEETING_REQUEST_POST] Error message:', error?.message);
        console.error('[MEETING_REQUEST_POST] Error code:', error?.code);
        console.error('[MEETING_REQUEST_POST] Error meta:', JSON.stringify(error?.meta));
        return NextResponse.json({ error: 'Failed to create meeting request', details: error?.message }, { status: 500 });
    }
}

// GET /api/meeting-requests?companyId=... — list meeting requests for a company
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
        }

        const requests = await prisma.meetingRequest.findMany({
            where: {
                OR: [{ fromCompanyId: companyId }, { toCompanyId: companyId }],
            },
            include: {
                fromCompany: { select: { id: true, name: true, logoUrl: true } },
                toCompany: { select: { id: true, name: true, logoUrl: true } },
                event: { select: { id: true, name: true } },
                meetingSlot: { 
                    select: { 
                        title: true, 
                        startTime: true, 
                        endTime: true,
                        meetingSessions: {
                            where: {
                                OR: [
                                    { companyId: companyId },
                                    { companyBId: companyId }
                                ]
                            },
                            select: {
                                table: true,
                                sessionIndex: true
                            }
                        }
                    } 
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('[MEETING_REQUEST_GET]', error);
        return NextResponse.json({ error: 'Failed to fetch meeting requests' }, { status: 500 });
    }
}
