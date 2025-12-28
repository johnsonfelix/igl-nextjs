
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const eventId = "cmjn1f6ih0000gad4xa4j7dp3";
    console.log(`Checking subtypes for event: ${eventId}`);

    const subtypes = await prisma.boothSubType.findMany({
        where: { eventId: eventId },
    });

    console.log(`Found ${subtypes.length} subtypes:`);
    console.log(JSON.stringify(subtypes, null, 2));

    const booths = await prisma.booth.findMany({
        include: { subTypes: true } // Check if relation exists generally
    });
    console.log("Checking all booths and their subtypes count:");
    booths.forEach(b => {
        console.log(`Booth ${b.name} (${b.id}): ${b.subTypes.length} subtypes`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
