
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSponsors() {
  const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
  try {
    const poItems = await prisma.orderItem.findMany({
      where: {
        order: {
          eventId: eventId,
        },
        OR: [
          { productType: { contains: 'sponsor', mode: 'insensitive' } },
          { name: { contains: 'sponsor', mode: 'insensitive' } }
        ]
      },
      include: {
        order: {
          include: {
            company: true
          }
        }
      }
    });

    console.log('--- Order Items matching "sponsor" ---');
    poItems.forEach(item => {
      console.log(`PO ID: ${item.order.id}`);
      console.log(`Status: ${item.order.status}`);
      console.log(`Company: ${item.order.company.name}`);
      console.log(`Item Name: ${item.name}`);
      console.log(`Product Type: ${item.productType}`);
      console.log('-------------------------');
    });

    const eventSponsorTypes = await prisma.eventSponsorType.findMany({
      where: { eventId: eventId },
      include: { sponsorType: true }
    });

    console.log('\n--- Event Sponsor Types defined for this event ---');
    eventSponsorTypes.forEach(est => {
      console.log(`Name: ${est.sponsorType.name}`);
      console.log(`Quantity: ${est.quantity}`);
      console.log('-------------------------');
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSponsors();
