const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const log = [];
    const logIt = (msg) => { console.log(msg); log.push(msg); };
    
    // Delete DECLINED duplicates - keep the ACCEPTED ones
    // Group 1: keep cmmemy0cr0001ju1ef7r1l4i8 (ACCEPTED), delete cmmk85rsw0003gatstz0j2o3c (DECLINED)
    // Group 2: keep cmmem8sm20002ld1ensc8qnk8 (ACCEPTED), delete cmmeenmjv0008gas09daefc95 (DECLINED)
    
    logIt('Deleting DECLINED duplicate records...');
    
    const del1 = await prisma.$executeRawUnsafe(`DELETE FROM "MeetingRequest" WHERE id = 'cmmk85rsw0003gatstz0j2o3c'`);
    logIt(`  Deleted cmmk85rsw0003gatstz0j2o3c (DECLINED): ${del1} row(s)`);
    
    const del2 = await prisma.$executeRawUnsafe(`DELETE FROM "MeetingRequest" WHERE id = 'cmmeenmjv0008gas09daefc95'`);
    logIt(`  Deleted cmmeenmjv0008gas09daefc95 (DECLINED): ${del2} row(s)`);
    
    // Now create the unique index
    logIt('Creating unique index...');
    try {
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX "MeetingRequest_meetingSlotId_fromCompanyId_toCompanyId_key" 
            ON "MeetingRequest"("meetingSlotId", "fromCompanyId", "toCompanyId")
        `);
        logIt('  ✅ Unique index created successfully!');
    } catch (e) {
        logIt(`  Error: ${e.message}`);
    }
    
    // Verify
    logIt('\n=== Final verification ===');
    const totalCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM "MeetingRequest"`);
    logIt(`Total MeetingRequest records: ${totalCount[0].cnt}`);
    
    const indexes = await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE tablename = 'MeetingRequest'`;
    for (const i of indexes) {
        logIt(`  Index: ${i.indexname}`);
    }
    
    logIt('\n=== Done! ===');
    fs.writeFileSync('tmp_output.json', log.join('\n'));
}

main().catch(e => {
    console.error('Failed:', e.message);
    process.exit(1);
}).finally(() => prisma.$disconnect());
