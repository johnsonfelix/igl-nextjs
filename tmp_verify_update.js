const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const newEmail = 'sales@gfm.world';
  const oldEmail = 'hjuschas@gmail.com';

  console.log('--- Verifying User ---');
  const user = await prisma.user.findUnique({
    where: { email: newEmail },
    include: { companies: { include: { location: true } } }
  });
  console.log('User found:', JSON.stringify(user, null, 2));

  const oldUser = await prisma.user.findUnique({
    where: { email: oldEmail }
  });
  if (oldUser) {
    console.log('ERROR: User still exists with old email!');
  } else {
    console.log('Success: User with old email no longer exists.');
  }

  console.log('\n--- Verifying Locations ---');
  if (user && user.companies.length > 0) {
    for (const company of user.companies) {
      const locations = await prisma.location.findMany({
        where: { companyId: company.id }
      });
      console.log(`Company ${company.name} has ${locations.length} locations:`, JSON.stringify(locations, null, 2));
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
