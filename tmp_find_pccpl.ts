import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'info@pccpl.com.au' },
    include: { companies: true }
  });
  console.log('User pccpl:', user);

  
  const locs = await prisma.location.findMany({
    where: { email: 'info@pccpl.com.au' },
    include: { company: true }
  });
  console.log('Companies by Location Email:', locs);

  
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

  
  const usersWithNoCompany = await prisma.user.findMany({
    where: {
      companies: {
        none: {}
      }
    },
    select: { id: true, email: true }
  });

  console.log('Total users without companies:', usersWithNoCompany.length);

  
  let unlinkedAndFoundMatch = 0;
  for (const u of usersWithNoCompany) {
    const loc = await prisma.location.findFirst({
      where: { email: u.email }
    });
    if (loc) {
      unlinkedAndFoundMatch++;
      
    }
  }
  console.log('Unlinked users that can be matched by exact Location email:', unlinkedAndFoundMatch);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
