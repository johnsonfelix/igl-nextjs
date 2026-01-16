
const { PrismaClient } = require("@prisma/client");
// Try bcryptjs if bcrypt fails, but package.json has both.
let bcrypt;
try {
    bcrypt = require("bcrypt");
} catch (e) {
    bcrypt = require("bcryptjs");
}

const prisma = new PrismaClient();

async function main() {
    // Fetch all companies with their location email
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            memberId: true,
            location: {
                select: { email: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`Found ${companies.length} companies.`);
    console.log("| Company Name | Login Email | Temporary Password |");
    console.log("|---|---|---|");

    for (const company of companies) {
        let email = company.location?.email;

        if (!email) {
            console.warn(`SKIPPED: ${company.name} - No email found in Location.`);
            continue;
        }

        email = email.trim().toLowerCase();

        // Generate credentials
        const rawPassword = `IGL${Math.floor(1000 + Math.random() * 9000)}`;

        // Hash password
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Create or Update User
        try {
            const user = await prisma.user.upsert({
                where: { email },
                update: {
                    password: hashedPassword,
                    name: company.name,
                    role: "USER",
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
        } catch (e) {
            console.error(`FAILED: ${company.name} (${email}) - ${e.message}`);
        }
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
