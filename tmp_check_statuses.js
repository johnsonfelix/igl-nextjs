
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatuses() {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      select: { status: true }
    });
    const statuses = new Set(pos.map(p => p.status));
    console.log('Unique Statuses:', Array.from(statuses));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatuses();
