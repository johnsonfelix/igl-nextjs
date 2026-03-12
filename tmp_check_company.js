const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: 'Allseas', mode: 'insensitive' } },
        { name: { contains: 'Manchester', mode: 'insensitive' } }
      ]
    },
    include: {
        user: true,
        location: true
    }
  });

  console.log('Found companies:', JSON.stringify(companies, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
