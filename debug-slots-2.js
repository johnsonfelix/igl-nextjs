
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUG START ---");
    const eventId = "cmjn1f6ih0000gad4xa4j7dp3";
    console.log(`Target Event ID: ${eventId}`);

    const subtypes = await prisma.boothSubType.findMany({
        where: { eventId: eventId },
    });
    console.log(`Subtypes strictly for this event: ${subtypes.length}`);
    if (subtypes.length > 0) {
        console.log(JSON.stringify(subtypes, null, 2));
    } else {
        console.log("No subtypes found for this event.");
    }

    // Check if there are ANY subtypes for these booths, maybe under different event?
    // First get booths for this event
    const eventBooths = await prisma.eventBooth.findMany({
        where: { eventId },
        include: { booth: true }
    });

    if (eventBooths.length === 0) {
        // Fallback to legacy booths check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { booths: true }
        });
        console.log(`Legacy Booths count: ${event?.booths?.length || 0}`);
        if (event?.booths) {
            for (const b of event.booths) {
                const count = await prisma.boothSubType.count({ where: { boothId: b.id } });
                console.log(`Booth ${b.name} (${b.id}) has ${count} subtypes globally.`);

                if (count > 0) {
                    const sample = await prisma.boothSubType.findFirst({ where: { boothId: b.id } });
                    console.log(`Sample subtype eventId: ${sample.eventId}`);
                }
            }
        }
    } else {
        console.log(`EventBooths (via Join) count: ${eventBooths.length}`);
        for (const eb of eventBooths) {
            const b = eb.booth;
            const count = await prisma.boothSubType.count({ where: { boothId: b.id } });
            console.log(`Booth ${b.name} (${b.id}) has ${count} subtypes globally.`);

            const strictCount = await prisma.boothSubType.count({ where: { boothId: b.id, eventId } });
            console.log(`   -> For this event: ${strictCount}`);
        }
    }

    console.log("--- DEBUG END ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
