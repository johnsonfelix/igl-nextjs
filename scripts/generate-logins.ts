
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    // Fetch all companies
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, memberId: true },
        orderBy: { name: 'asc' }
    });

    console.log(`Found ${companies.length} companies.`);
    console.log("| Company Name | Login Email | Temporary Password |");
    console.log("|---|---|---|");

    for (const company of companies) {
        if (!company.memberId) {
            // Should not happen based on schema but safe check
            console.warn(`Skipping company ${company.name} (no memberId)`);
            continue;
        }

        // Generate credentials
        const cleanMemberId = company.memberId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const email = `${cleanMemberId}@iglnetwork.com`; // Unique email based on memberId
        const rawPassword = `IGL${Math.floor(1000 + Math.random() * 9000)}`; // Simple 4-digit code e.g., IGL1234

        // Hash password
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Create or Update User
        // We use upsert on email to ensure we don't duplicate if run multiple times
        // But wait, if user exists, we are overwriting password.
        // The requirement is "give me the mail id and passoword". 
        // This implies I should reset it to something I know so I can give it.

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name: company.name,
                role: "USER", // Default role
                isCompleted: true,
            },
            create: {
                email,
                password: hashedPassword,
                name: company.name,
                role: "USER",
                isCompleted: true,
            },
        });

        // Link User to Company
        await prisma.company.update({
            where: { id: company.id },
            data: { userId: user.id },
        });

        console.log(`| ${company.name.padEnd(30)} | ${email.padEnd(30)} | ${rawPassword} |`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
