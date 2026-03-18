
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSponsors() {
  const eventId = "cmjn1f6ih0000gad4xa4j7dp3";
  
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventSponsorTypes: {
          include: {
            sponsorType: true
          }
        },
        purchaseOrders: {
          where: {
            items: {
                some: {
                    productType: 'SPONSOR'
                }
            }
          },
          include: {
            company: true,
            items: true
          }
        }
      }
    });

    if (!event) {
      console.log("Event not found");
      return;
    }

    console.log("Event Name:", event.name);
    console.log("\nSponsor Types defined for this event:");
    event.eventSponsorTypes.forEach(est => {
      console.log(`- ${est.sponsorType.name} (Sort: ${est.sponsorType.sortOrder})`);
    });

    console.log("\nPurchase Orders with Sponsors:");
    event.purchaseOrders.forEach(po => {
      console.log(`PO ID: ${po.id}, Status: ${po.status}, Company: ${po.company?.name || 'N/A'}`);
      const items = po.items as any[];
      items.forEach(item => {
        if (item.productType === 'SPONSOR') {
          console.log(`  - Item: ${item.name}`);
        }
      });
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSponsors();
