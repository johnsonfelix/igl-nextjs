import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        take: 5,
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
}

main().catch(console.error).finally(() => prisma.$disconnect());
