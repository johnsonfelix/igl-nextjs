const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];

    if (!email || !password) {
        console.error('Usage: node scripts/create-admin.js <email> <password>');
        process.exit(1);
    }

    console.log(`Processing admin user for email: ${email}`);

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        const hashedPassword = await hash(password, 10);

        if (existingUser) {
            console.log('User exists. Updating role to ADMIN...');
            await prisma.user.update({
                where: { email },
                data: {
                    role: 'ADMIN',
                    password: hashedPassword, // Update password too just in case
                },
            });
            console.log('User updated successfully.');
        } else {
            console.log('User does not exist. Creating new ADMIN user...');
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    name: 'System Admin',
                },
            });
            console.log('Admin user created successfully.');
        }
    } catch (e) {
        console.error('Error creating admin user:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
