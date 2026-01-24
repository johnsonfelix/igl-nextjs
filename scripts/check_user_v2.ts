
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "suhlaing@ecoasiapte.com";
    console.log(`CHECKING_START`);

    // 1. Exact match
    const exact = await prisma.user.findFirst({
        where: { email: email }
    });
    console.log("EXACT_MATCH: " + (exact ? "YES" : "NO"));
    if (exact) console.log(JSON.stringify(exact));

    // 2. Insensitive (manual DB check if needed)
    const allUsers = await prisma.user.findMany({
        where: {
            email: {
                contains: "ecoasiapte.com",
                mode: 'insensitive'
            }
        }
    });

    console.log(`FOUND_USERS_COUNT: ${allUsers.length}`);
    allUsers.forEach(u => {
        console.log(`USER: ${u.email} (ID: ${u.id})`);
    });

    console.log(`CHECKING_END`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
