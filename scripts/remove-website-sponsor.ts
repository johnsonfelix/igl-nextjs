
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';

    console.log(`Checking event: ${eventId}`);

    // Find the event to confirm existence
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            eventSponsorTypes: {
                include: {
                    sponsorType: true
                }
            }
        }
    });

    if (!event) {
        console.log(`Event ${eventId} not found`);
        return;
    }

    console.log(`Event found: ${event.name}`);
    console.log('Current Sponsors:');
    event.eventSponsorTypes.forEach(est => {
        console.log(`- ${est.sponsorType.name} (ID: ${est.sponsorTypeId})`);
    });

    // Find "Website" sponsor (case-insensitive check)
    const websiteSponsor = event.eventSponsorTypes.find(est =>
        est.sponsorType.name.toLowerCase().trim() === 'website' ||
        est.sponsorType.name.toLowerCase().includes('website')
    );

    if (websiteSponsor) {
        console.log(`Found 'Website' sponsor type: "${websiteSponsor.sponsorType.name}" (ID: ${websiteSponsor.sponsorTypeId})`);
        console.log('Deleting association...');

        await prisma.eventSponsorType.delete({
            where: {
                eventId_sponsorTypeId: {
                    eventId: eventId,
                    sponsorTypeId: websiteSponsor.sponsorTypeId
                }
            }
        });

        console.log('Successfully removed Website sponsor from event.');
    } else {
        console.log('No "Website" sponsor found assigned to this event.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
