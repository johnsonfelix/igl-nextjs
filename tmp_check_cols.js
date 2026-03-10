const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    // Check existing MeetingRequest data
    const existingRequests = await prisma.$queryRawUnsafe(`SELECT * FROM "MeetingRequest" LIMIT 5`);
    console.log('Existing MeetingRequest data count check...');
    fs.writeFileSync('tmp_output.json', JSON.stringify(existingRequests, null, 2));
    
    // Check if meetingSlotId column already exists
    const hasSlotCol = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'MeetingRequest' AND column_name = 'meetingSlotId'
    `;
    
    // Check existing constraints
    const constraints = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'MeetingRequest'
    `;
    
    // Check foreign keys 
    const fkeys = await prisma.$queryRaw`
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'MeetingRequest' AND tc.constraint_type = 'FOREIGN KEY'
    `;
    
    // Check indexes
    const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'MeetingRequest'
    `;
    
    fs.writeFileSync('tmp_output.json', JSON.stringify({
        existingRequests,
        hasSlotCol,
        constraints,
        fkeys,
        indexes
    }, null, 2));
    
    console.log('Done. Results written to tmp_output.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
