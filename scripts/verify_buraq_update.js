const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'info@alburaqcargo.co.uk';
  const newEmail = 'thanoof@buraq.com.sa';

  console.log(`Verifying old email: ${oldEmail}`);
  const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
  const oldLocs = await prisma.location.findMany({ where: { email: oldEmail } });

  console.log(`Old User found: ${!!oldUser}`);
  console.log(`Old Locations found: ${oldLocs.length}`);

  console.log(`\nVerifying new email: ${newEmail}`);
  const newUser = await prisma.user.findUnique({ where: { email: newEmail } });
  const newLocs = await prisma.location.findMany({ where: { email: newEmail } });

  console.log(`New User found: ${!!newUser}`);
  if (newUser) console.log(`User ID: ${newUser.id}`);
  console.log(`New Locations found: ${newLocs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
