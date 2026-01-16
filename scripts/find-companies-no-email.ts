import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching companies...");
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            memberId: true,
            location: {
                select: {
                    email: true,
                }
            },
            user: {
                select: {
                    email: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    const noEmailCompanies = companies.filter(c => {
        const hasUserEmail = c.user?.email && c.user.email.trim().length > 0;
        const hasLocationEmail = c.location?.email && c.location.email.trim().length > 0;
        return !hasUserEmail && !hasLocationEmail;
    });

    console.log(`\nFound ${noEmailCompanies.length} companies without any email (User or Location). Writing to JSON...`);

    fs.writeFileSync('no-email-companies.json', JSON.stringify(noEmailCompanies, null, 2));
    console.log("Done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
