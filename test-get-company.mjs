import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching top 10 companies to check their emails...");
    const companies = await prisma.company.findMany({
        take: 10,
        include: {
            location: { select: { email: true } },
            user: { select: { email: true } }
        }
    });

    console.log("Companies:", JSON.stringify(companies.map(c => ({
        id: c.id,
        name: c.name,
        locationEmail: c.location?.email,
        userEmail: c.user?.email
    })), null, 2));

    const specific = await prisma.company.findFirst({
        where: { name: { contains: 'GLOBAL FREIGHT MANAGEMENT B.V' } },
        include: { location: { select: { email: true } }, user: { select: { email: true } } }
    });
    console.log("Specific company GLOBAL FREIGHT MANAGEMENT B.V:", specific ? { name: specific.name, loc: specific.location?.email, usr: specific.user?.email } : 'Not found');
}

main().catch(console.error).finally(() => prisma.$disconnect());
