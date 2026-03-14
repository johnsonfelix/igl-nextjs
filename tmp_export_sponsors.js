
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportSponsors() {
  const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
  try {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          eventId: eventId
        }
      },
      include: {
        order: {
          include: {
            company: true
          }
        }
      }
    });

    const ests = await prisma.eventSponsorType.findMany({
      where: { eventId: eventId },
      include: { sponsorType: true }
    });
    
    const result = {
      items: items.map(it => ({
        name: it.name,
        productType: it.productType,
        status: it.order.status,
        company: it.order.company.name
      })),
      eventSponsorTypes: ests.map(est => ({
        name: est.sponsorType.name,
        quantity: est.quantity
      }))
    };

    fs.writeFileSync('tmp_sponsors_data.json', JSON.stringify(result, null, 2));
    console.log('DONE');

  } catch (err) {
    console.log('ERROR:' + err.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportSponsors();
