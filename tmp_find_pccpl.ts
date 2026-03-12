import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'info@pccpl.com.au' },
    include: { companies: true }
  });
  console.log('User pccpl:', user);

  // let's look for a company that might belong to pccpl
  const locs = await prisma.location.findMany({
    where: { email: 'info@pccpl.com.au' },
    include: { company: true }
  });
  console.log('Companies by Location Email:', locs);

  // find any company without a userId
  const mCompany = await prisma.company.findMany({
    where: { 
      OR: [
        { name: { contains: 'pccpl', mode: 'insensitive' } },
        { name: { contains: 'pacific', mode: 'insensitive' } },
        { website: { contains: 'pccpl', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Companies with name pccpl:', mCompany);

  // find users without companies
  const usersWithNoCompany = await prisma.user.findMany({
    where: {
      companies: {
        none: {}
      }
    },
    select: { id: true, email: true }
  });

  console.log('Total users without companies:', usersWithNoCompany.length);

  // Find overlapping domains or matching Location emails
  let unlinkedAndFoundMatch = 0;
  for (const u of usersWithNoCompany) {
    const loc = await prisma.location.findFirst({
      where: { email: u.email }
    });
    if (loc) {
      unlinkedAndFoundMatch++;
      // console.log(`Unlinked User ${u.email} has a Location match for Company ${loc.companyId}`);
    }
  }
  console.log('Unlinked users that can be matched by exact Location email:', unlinkedAndFoundMatch);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
