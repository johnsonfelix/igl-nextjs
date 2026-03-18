const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSponsors() {
  const eventId = "cmjn1f6ih0000gad4xa4j7dp3";
  const eventData = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      purchaseOrders: {
        where: {
          status: 'COMPLETED',
          items: {
            some: {
              productType: 'SPONSOR'
            }
          }
        },
        include: {
          company: true,
          items: {
            where: {
              productType: 'SPONSOR'
            }
          }
        }
      },
      eventSponsorTypes: {
        include: { sponsorType: true },
        orderBy: {
          sponsorType: {
            sortOrder: 'asc'
          }
        }
      }
    }
  });

  if (!eventData) {
    console.log("Event not found");
    return;
  }

  const sortedTiers = eventData.eventSponsorTypes.map((s) => s.sponsorType);
  const groups = {};
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  eventData.purchaseOrders.forEach((po) => {
    po.items.forEach((item) => {
      const itemName = normalize(item.name);
      sortedTiers.forEach((tier) => {
        const tierName = normalize(tier.name);
        if (itemName.includes(tierName) || tierName.includes(itemName)) {
          if (!groups[tier.name]) groups[tier.name] = [];
          if (!groups[tier.name].some((c) => c.id === po.company.id)) {
            groups[tier.name].push({
              id: po.company.id,
              name: po.company.name,
              logoUrl: po.company.logoUrl,
            });
          }
        }
      });
    });
  });

  const sponsorsByTier = sortedTiers
    .filter((tier) => groups[tier.name] && groups[tier.name].length > 0)
    .map((tier) => ({
      tier: tier.name,
      companies: groups[tier.name],
    }));

  const fs = require('fs');
  fs.writeFileSync('scripts/sponsors_data.json', JSON.stringify(sponsorsByTier, null, 2), 'utf-8');
  console.log("Data saved to scripts/sponsors_data.json");
}

getSponsors()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
