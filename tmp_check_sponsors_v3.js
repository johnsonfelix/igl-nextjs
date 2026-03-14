
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSponsors() {
  const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
  try {
    const items = await prisma.orderItem.findMany({
      include: {
        order: {
          include: {
            company: true
          }
        }
      }
    });

    // filter manually to be sure
    const eventItems = items.filter(it => it.order.eventId === eventId);
    
    console.log(`TOTAL ITEMS FOR EVENT: ${eventItems.length}`);
    
    const sponsors = eventItems.filter(it => 
      it.productType.toUpperCase().includes('SPONSOR') || 
      it.name.toLowerCase().includes('sponsor')
    );

    sponsors.forEach(it => {
      console.log(`ITEM: ${it.name}`);
      console.log(`TYPE: ${it.productType}`);
      console.log(`STATUS: ${it.order.status}`);
      console.log(`COMPANY: ${it.order.company.name}`);
      console.log('---');
    });

  } catch (err) {
    console.log('ERROR: ' + err.message);
  } finally {
    await prisma.$disconnect();
  }
}

findSponsors();
