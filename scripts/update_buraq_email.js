const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'info@alburaqcargo.co.uk';
  const newEmail = 'thanoof@buraq.com.sa';

  console.log(`Searching for user with email: ${oldEmail}`);
  const user = await prisma.user.findUnique({
    where: { email: oldEmail },
    include: {
      companies: {
        include: {
          location: true
        }
      }
    }
  });

  if (!user) {
    console.log('No user found with the old email.');
  } else {
    console.log(`Updating User ${user.id} email to ${newEmail}`);
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail }
    });
    console.log('User email updated.');

    for (const company of user.companies) {
      if (company.location && company.location.email === oldEmail) {
        console.log(`Updating Location ${company.location.id} email to ${newEmail}`);
        await prisma.location.update({
          where: { id: company.location.id },
          data: { email: newEmail }
        });
        console.log('Location email updated.');
      }
    }
  }

  // Also check for any locations that might not be directly linked to this user but have the email
  const strayLocations = await prisma.location.findMany({
    where: { email: oldEmail }
  });

  if (strayLocations.length > 0) {
    console.log(`Found ${strayLocations.length} stray locations with the old email. Updating...`);
    for (const loc of strayLocations) {
      await prisma.location.update({
        where: { id: loc.id },
        data: { email: newEmail }
      });
      console.log(`Stray Location ${loc.id} updated.`);
    }
  }

  console.log('Update complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
