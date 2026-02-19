import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Simple UA parser — no dependencies
function parseUserAgent(ua: string) {
    let device = 'Desktop';
    if (/mobile|android.*phone|iphone|ipod/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) device = 'Tablet';

    let browser = 'Other';
    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
    else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
    else if (/firefox\//i.test(ua)) browser = 'Firefox';
    else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Safari';

    let os = 'Other';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
}

// Resolve geo from IP using free ip-api.com
async function resolveGeo(ip: string): Promise<{ country: string; city: string } | null> {
    // Skip local/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return null;
    }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { country: data.country || 'Unknown', city: data.city || 'Unknown' };
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, page, referrer, duration } = body;

        if (!sessionId || !page) {
            return NextResponse.json({ error: 'sessionId and page are required' }, { status: 400 });
        }

        // Get client IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '';

        // Parse user-agent
        const ua = req.headers.get('user-agent') || '';
        const { device, browser, os } = parseUserAgent(ua);

        // Resolve geolocation (fire and resolve inline — fast with timeout)
        const geo = await resolveGeo(ip);

        // If duration > 0, this is an update call — try to update existing visit
        if (duration && duration > 0) {
            const existing = await prisma.siteVisit.findFirst({
                where: { sessionId, page },
                orderBy: { createdAt: 'desc' },
            });
            if (existing) {
                await prisma.siteVisit.update({
                    where: { id: existing.id },
                    data: { duration: Math.min(duration, 3600) }, // cap at 1 hour
                });
                return NextResponse.json({ ok: true, updated: true });
            }
        }

        // Create new visit record
        await prisma.siteVisit.create({
            data: {
                sessionId,
                page,
                referrer: referrer || null,
                ip: ip || null,
                country: geo?.country || null,
                city: geo?.city || null,
                device,
                browser,
                os,
                duration: 0,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Analytics track error:', error.message);
        return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }
}
