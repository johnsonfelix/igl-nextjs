const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Dropping MeetingSessionId constraint if exists...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "MeetingRequest" DROP CONSTRAINT IF EXISTS "MeetingRequest_meetingSessionId_fkey"`);
    } catch (e) {
        console.log("Could not drop constraint, might not exist.");
    }

    console.log('Dropping MeetingSessionId column...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "MeetingRequest" DROP COLUMN IF EXISTS "meetingSessionId" CASCADE`);
    } catch (e) {
        console.log("Could not drop column, might not exist: ", e.message);
    }
    console.log("Done dropping legagy columns/constraints.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
