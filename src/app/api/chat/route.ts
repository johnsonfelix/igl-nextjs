import { NextRequest, NextResponse } from 'next/server';
import {
    BedrockRuntimeClient,
    ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { prisma } from '@/app/lib/prisma';

const client = new BedrockRuntimeClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY!,
    },
});

// ---------- helpers to build dynamic context ----------

async function getKnowledgeContext(): Promise<string> {
    try {
        const [
            membershipPlans,
            upcomingEvents,
            pastEvents,
            memberCount,
            testimonials,
        ] = await Promise.all([
            prisma.membershipPlan.findMany({
                orderBy: { price: 'asc' },
                select: {
                    name: true,
                    price: true,
                    features: true,
                    description: true,
                    paymentProtection: true,
                    discountPercentage: true,
                },
            }),
            prisma.event.findMany({
                where: { startDate: { gte: new Date() } },
                orderBy: { startDate: 'asc' },
                take: 3,
                include: {
                    venue: { select: { name: true, location: true } },
                    eventTickets: {
                        include: {
                            ticket: {
                                select: { name: true, price: true, sellingPrice: true, features: true },
                            },
                        },
                    },
                    eventSponsorTypes: {
                        include: {
                            sponsorType: {
                                select: { name: true, price: true, features: true },
                            },
                        },
                    },
                    eventBooths: {
                        include: {
                            booth: {
                                select: { name: true, price: true },
                            },
                        },
                    },
                    hotels: {
                        select: {
                            hotelName: true,
                            roomTypes: {
                                select: { roomType: true, price: true, amenities: true },
                            },
                        },
                    },
                    agendaItems: {
                        orderBy: { startTime: 'asc' },
                        select: { title: true, description: true, date: true, startTime: true, endTime: true },
                    },
                },
            }),
            prisma.pastEvent.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { title: true, place: true, date: true, membersAttended: true, description: true },
            }),
            prisma.company.count({ where: { status: 'LIVE' } }),
            prisma.testimonial.findMany({
                where: { isActive: true },
                take: 5,
                select: { name: true, role: true, description: true, rating: true },
            }),
        ]);

        const sections: string[] = [];

        // Membership Plans
        if (membershipPlans.length > 0) {
            sections.push('=== MEMBERSHIP PLANS ===');
            for (const plan of membershipPlans) {
                const lines = [`Plan: ${plan.name} — $${plan.price}/year`];
                if (plan.description) lines.push(`  Description: ${plan.description}`);
                if (plan.paymentProtection) lines.push(`  Payment Protection: ${plan.paymentProtection}`);
                if (plan.discountPercentage && plan.discountPercentage > 0) lines.push(`  Event Discount: ${plan.discountPercentage}%`);
                if (plan.features.length > 0) lines.push(`  Features: ${plan.features.join('; ')}`);
                sections.push(lines.join('\n'));
            }
        }

        // Member Network
        sections.push(`\n=== NETWORK SIZE ===\nIGLA currently has ${memberCount} active member companies worldwide.`);

        // Upcoming Events
        if (upcomingEvents.length > 0) {
            sections.push('\n=== UPCOMING EVENTS ===');
            for (const evt of upcomingEvents) {
                const lines = [`Event: ${evt.name}`];
                lines.push(`  Location: ${evt.location}`);
                if (evt.startDate) lines.push(`  Start Date: ${evt.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
                if (evt.endDate) lines.push(`  End Date: ${evt.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
                if (evt.expectedAudience) lines.push(`  Expected Audience: ${evt.expectedAudience}`);
                if (evt.description) lines.push(`  Description: ${evt.description}`);
                if (evt.venue) lines.push(`  Venue: ${evt.venue.name}${evt.venue.location ? ' — ' + evt.venue.location : ''}`);

                // Tickets
                if (evt.eventTickets.length > 0) {
                    lines.push('  Tickets:');
                    for (const et of evt.eventTickets) {
                        const t = et.ticket;
                        const price = t.sellingPrice ?? t.price;
                        lines.push(`    - ${t.name}: $${price}${t.features.length ? ' | ' + t.features.join(', ') : ''}`);
                    }
                }

                // Sponsorship types
                if (evt.eventSponsorTypes.length > 0) {
                    lines.push('  Sponsorship Opportunities:');
                    for (const es of evt.eventSponsorTypes) {
                        const s = es.sponsorType;
                        lines.push(`    - ${s.name}: $${s.price}${s.features.length ? ' | ' + s.features.join(', ') : ''}`);
                    }
                }

                // Booths
                if (evt.eventBooths.length > 0) {
                    lines.push('  Booths:');
                    for (const eb of evt.eventBooths) {
                        lines.push(`    - ${eb.booth.name}: $${eb.booth.price}`);
                    }
                }

                // Hotels
                if (evt.hotels.length > 0) {
                    lines.push('  Hotels:');
                    for (const hotel of evt.hotels) {
                        lines.push(`    - ${hotel.hotelName}`);
                        for (const rt of hotel.roomTypes) {
                            lines.push(`      Room: ${rt.roomType} — $${rt.price}/night${rt.amenities ? ' | ' + rt.amenities : ''}`);
                        }
                    }
                }

                // Agenda highlights
                if (evt.agendaItems.length > 0) {
                    lines.push('  Agenda Highlights:');
                    for (const ai of evt.agendaItems.slice(0, 5)) {
                        lines.push(`    - ${ai.title}${ai.description ? ': ' + ai.description : ''}`);
                    }
                    if (evt.agendaItems.length > 5) lines.push(`    ... and ${evt.agendaItems.length - 5} more sessions`);
                }

                sections.push(lines.join('\n'));
            }
        }

        // Past Events
        if (pastEvents.length > 0) {
            sections.push('\n=== PAST EVENTS ===');
            for (const pe of pastEvents) {
                sections.push(`- ${pe.title} (${pe.place}, ${pe.date}) — ${pe.membersAttended} members attended`);
            }
        }

        // Testimonials
        if (testimonials.length > 0) {
            sections.push('\n=== MEMBER TESTIMONIALS ===');
            for (const t of testimonials) {
                sections.push(`- "${t.description}" — ${t.name}, ${t.role} (${t.rating}/5 stars)`);
            }
        }

        return sections.join('\n');
    } catch (err) {
        console.error('Failed to fetch knowledge context:', err);
        return '(Dynamic data temporarily unavailable)';
    }
}

// ---------- static knowledge ----------

const STATIC_KNOWLEDGE = `About IGLA:
- IGLA (Innovative Global Logistics Allianz) is a premier network of independent freight forwarders and logistics companies worldwide, established in 2012.
- IGLA connects trusted logistics partners across continents for seamless international shipping solutions.
- IGLA provides risk management with payment protection of up to $150,000 for member collaborations.
- IGLA hosts annual Link Up Conferences bringing the global freight forwarding community together.
- Contact: sales@igla.asia
- Website: https://www.igla.asia

Regional Contacts:
- Europe: Mr. Fabian — fabian@igla.asia
- Americas: Mr. Marlond — marlond@igla.asia
- Africa / Australia: Mrs. Dovi — dovi@igla.asia
- South East Asia: Mr. Jonathan — jon.siva@igla.asia
- Middle East: Mr. Varadha — varadha@igla.asia
- India: info@igla.asia

Key Website Pages:
- /membership — View and purchase membership plans
- /event — Browse upcoming events
- /directory — Search the member company directory
- /inquiry — Post logistics inquiries
- /risk — Risk management and company reporting
- /contact-us — Contact the IGLA team
- /payment-protection — Learn about IGLA payment protection
- /secure-pay — IGLAPay instant member-to-member payments

Why Join IGLA:
1. Promote your business to thousands of active members globally
2. Build partnerships with quality, verified freight forwarding agents
3. Strict access review standards with risk protection
4. Free payment tools (IGLAPay) for fee-free, instant payments between members
5. Annual conferences for networking and business development`;

// ---------- handler ----------

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages: ChatMessage[] = body.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: 'messages array is required' },
                { status: 400 }
            );
        }

        // Fetch live data from the database
        const dynamicContext = await getKnowledgeContext();

        const systemPrompt = `You are the IGLA AI Assistant — a friendly, knowledgeable helper for the IGLA website.

${STATIC_KNOWLEDGE}

--- LIVE DATA FROM DATABASE ---
${dynamicContext}
--- END LIVE DATA ---

Your behavior:
- Be concise, helpful, and professional.
- Answer questions about IGLA membership plans, events, services, pricing, and logistics in general.
- When asked about membership plans, provide real pricing and features from the live data above.
- When asked about events, provide real event details, dates, ticket prices, sponsorship options, hotels etc. from the live data.
- When asked about the network size, provide the actual member count.
- If asked how to join or register, direct them to /membership or /company/register.
- If asked about inquiries, direct them to the Inquiry page at /inquiry.
- If asked about risk management or reporting a company, direct them to /risk.
- For regional contacts, provide the correct person and email from the list above.
- Do NOT share any physical address, office address, or headquarters location.
- If you don't know something specific, say so and suggest contacting sales@igla.asia.
- Keep responses short (2-4 sentences) unless the user asks for detailed information.
- Use bullet points or short lists when presenting multiple items like plan features or event details.
- Provide helpful links to relevant pages when applicable (e.g., "You can view our membership plans at /membership").`;

        const converseMessages = messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: [{ text: msg.content }],
        }));

        const command = new ConverseCommand({
            modelId: 'arn:aws:bedrock:ap-south-1:762703128013:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0',
            system: [{ text: systemPrompt }],
            messages: converseMessages,
            inferenceConfig: {
                maxTokens: 1024,
                temperature: 0.7,
            },
        });

        const response = await client.send(command);

        const assistantText =
            response.output?.message?.content?.[0]?.text ?? 'Sorry, I could not generate a response.';

        return NextResponse.json({ reply: assistantText });
    } catch (error: any) {
        console.error('Chat API error:', JSON.stringify({
            name: error.name,
            message: error.message,
            code: error.$metadata?.httpStatusCode,
            requestId: error.$metadata?.requestId,
            fault: error.$fault,
        }));
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
