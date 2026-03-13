const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'hjuschas@gmail.com';
  const companyName = 'Global Freight MANAGEMENT Deutschland GMBH';

  console.log('--- Checking User ---');
  const user = await prisma.user.findUnique({
    where: { email: oldEmail },
    include: { companies: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));

  console.log('\n--- Checking Company ---');
  const companies = await prisma.company.findMany({
    where: {
      name: { contains: 'Global Freight MANAGEMENT', mode: 'insensitive' }
    },
    include: {
        user: true,
        location: true
    }
  });
  console.log('Companies found:', JSON.stringify(companies, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
