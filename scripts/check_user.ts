
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "suhlaing@ecoasiapte.com";
    console.log(`Checking for user with email: "${email}"...`);

    const exactMatch = await prisma.user.findUnique({
        where: { email: email },
    });
    console.log("Exact match found:", exactMatch);

    // Check insensitive if not found
    if (!exactMatch) {
        const list = await prisma.user.findMany({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        });
        console.log("Insensitive match found:", list);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
