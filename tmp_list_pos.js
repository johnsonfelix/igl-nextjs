
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllPOs() {
  const eventId = 'cmjn1f6ih0000gad4xa4j7dp3';
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { eventId: eventId },
      include: {
        company: true,
        items: true
      }
    });

    console.log(`--- All Purchase Orders for Event ${eventId} ---`);
    console.log(`Count: ${pos.length}`);
    pos.forEach(po => {
      console.log(`PO ID: ${po.id}, Status: ${po.status}, Company: ${po.company.name}`);
      po.items.forEach(item => {
        console.log(`  - Item: ${item.name}, Type: ${item.productType}, Qty: ${item.quantity}`);
      });
      console.log('---');
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listAllPOs();
