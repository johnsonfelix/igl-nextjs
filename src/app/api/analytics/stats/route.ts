import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30', 10);
        const since = new Date();
        since.setDate(since.getDate() - days);

        // Run all queries in parallel
        const [
            totalVisits,
            uniqueVisitors,
            avgDurationResult,
            topPages,
            topCountries,
            deviceBreakdown,
            browserBreakdown,
            osBreakdown,
            recentVisits,
            visitsOverTime,
        ] = await Promise.all([
            // Total page views
            prisma.siteVisit.count({ where: { createdAt: { gte: since } } }),

            // Unique sessions
            prisma.siteVisit.groupBy({
                by: ['sessionId'],
                where: { createdAt: { gte: since } },
            }).then((r: any[]) => r.length),

            // Average duration
            prisma.siteVisit.aggregate({
                _avg: { duration: true },
                where: { createdAt: { gte: since }, duration: { gt: 0 } },
            }),

            // Top pages
            prisma.$queryRawUnsafe<{ page: string; count: bigint }[]>(
                `SELECT page, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY page ORDER BY count DESC LIMIT 10`,
                since
            ),

            // Top countries
            prisma.$queryRawUnsafe<{ country: string; count: bigint }[]>(
                `SELECT COALESCE(country, 'Unknown') as country, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 AND country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10`,
                since
            ),

            // Device breakdown
            prisma.$queryRawUnsafe<{ device: string; count: bigint }[]>(
                `SELECT COALESCE(device, 'Unknown') as device, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY device ORDER BY count DESC`,
                since
            ),

            // Browser breakdown
            prisma.$queryRawUnsafe<{ browser: string; count: bigint }[]>(
                `SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY browser ORDER BY count DESC LIMIT 8`,
                since
            ),

            // OS breakdown
            prisma.$queryRawUnsafe<{ os: string; count: bigint }[]>(
                `SELECT COALESCE(os, 'Unknown') as os, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY os ORDER BY count DESC LIMIT 8`,
                since
            ),

            // Recent 50 visits
            prisma.siteVisit.findMany({
                where: { createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true,
                    page: true,
                    ip: true,
                    country: true,
                    city: true,
                    device: true,
                    browser: true,
                    os: true,
                    duration: true,
                    referrer: true,
                    createdAt: true,
                },
            }),

            // Visits over time (daily)
            prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
                `SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::bigint as count FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY date ORDER BY date ASC`,
                since
            ),
        ]);

        // Single-page sessions (bounce rate)
        const sessionPageCounts = await prisma.$queryRawUnsafe<{ sessionid: string; pages: bigint }[]>(
            `SELECT "sessionId" as sessionid, COUNT(DISTINCT page)::bigint as pages FROM "SiteVisit" WHERE "createdAt" >= $1 GROUP BY "sessionId"`,
            since
        );
        const totalSessions = sessionPageCounts.length;
        const bounceSessions = sessionPageCounts.filter(s => Number(s.pages) === 1).length;
        const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

        // Serialize bigints to numbers
        const serialize = (arr: { count: bigint;[key: string]: any }[]) =>
            arr.map(item => ({ ...item, count: Number(item.count) }));

        return NextResponse.json({
            totalVisits,
            uniqueVisitors,
            avgDuration: Math.round(avgDurationResult._avg.duration || 0),
            bounceRate,
            topPages: serialize(topPages),
            topCountries: serialize(topCountries),
            deviceBreakdown: serialize(deviceBreakdown),
            browserBreakdown: serialize(browserBreakdown),
            osBreakdown: serialize(osBreakdown),
            recentVisits: recentVisits.map((v: any) => ({
                ...v,
                createdAt: v.createdAt.toISOString(),
            })),
            visitsOverTime: visitsOverTime.map((v: any) => ({
                date: v.date,
                count: Number(v.count),
            })),
        });
    } catch (error: any) {
        console.error('Analytics stats error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
