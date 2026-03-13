const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'hjuschas@gmail.com';
  const newEmail = 'sales@gfm.world';

  console.log('--- Updating User ---');
  const updatedUser = await prisma.user.update({
    where: { email: oldEmail },
    data: { email: newEmail }
  });
  console.log('Updated User:', JSON.stringify(updatedUser, null, 2));

  console.log('\n--- Checking and Updating Locations ---');
  // Find locations associated with the company that have the old email
  const company = await prisma.company.findFirst({
    where: {
      user: { id: updatedUser.id }
    }
  });

  if (company) {
    const locations = await prisma.location.findMany({
      where: {
        companyId: company.id,
        email: oldEmail
      }
    });

    console.log(`Found ${locations.length} locations to update.`);

    for (const loc of locations) {
      const updatedLoc = await prisma.location.update({
        where: { id: loc.id },
        data: { email: newEmail }
      });
      console.log('Updated Location:', JSON.stringify(updatedLoc, null, 2));
    }
  } else {
    console.log('No company found for the updated user.');
  }

  // Double check if any other user has this email (shouldn't happen, but good to check)
  const otherUsers = await prisma.user.findMany({
    where: { email: oldEmail }
  });
  if (otherUsers.length > 0) {
    console.log('WARNING: Other users still have the old email:', JSON.stringify(otherUsers, null, 2));
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
