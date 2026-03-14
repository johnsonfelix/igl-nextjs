
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSponsors() {
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

    console.log(`TOTAL_ITEMS:${items.length}`);
    
    items.forEach(it => {
      if (it.productType.toUpperCase().includes('SPONSOR') || it.name.toLowerCase().includes('sponsor')) {
        console.log(`ITEM:${it.name}|TYPE:${it.productType}|STATUS:${it.order.status}|COMPANY:${it.order.company.name}`);
      }
    });

    const ests = await prisma.eventSponsorType.findMany({
      where: { eventId: eventId },
      include: { sponsorType: true }
    });
    
    ests.forEach(est => {
       console.log(`EST:${est.sponsorType.name}|QTY:${est.quantity}`);
    });

  } catch (err) {
    console.log('ERROR:' + err.message);
  } finally {
    await prisma.$disconnect();
  }
}

findSponsors();
