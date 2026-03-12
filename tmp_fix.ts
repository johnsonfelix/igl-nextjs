import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersWithNoCompany = await prisma.user.findMany({
    where: { companies: { none: {} } },
    select: { id: true, email: true }
  });

  const allLocations = await prisma.location.findMany({
    include: { company: true }
  });

  let fixedCount = 0;
  for (const u of usersWithNoCompany) {
    // case insensitive match
    const loc = allLocations.find(l => l.email && l.email.toLowerCase().trim() === u.email.toLowerCase().trim());
    if (loc) {
      console.log(`Linking user ${u.email} to company ${loc.company.name}`);
      await prisma.company.update({
        where: { id: loc.companyId },
        data: { userId: u.id }
      });
      fixedCount++;
    } else {
      // try to match company direct email if it exists although location is main
      // or match by name if user.name matches somewhat?
      // For now we rely on email match.
    }
  }

  console.log(`Successfully linked ${fixedCount} users to their companies.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
