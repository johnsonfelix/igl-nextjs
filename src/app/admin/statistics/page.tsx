import { prisma } from "@/app/lib/prisma";
import StatisticsClient from "./StatisticsClient";

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
    
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const totalVisits = await prisma.siteVisit.count({ where: { createdAt: { gte: since } } });

    return <StatisticsClient initialTotalVisits={totalVisits} />;
}
