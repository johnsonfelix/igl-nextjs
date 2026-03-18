const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lowercaseUserId = 'cmkf1vwpe0000gaj0oiodosv7'; // sheffield@5-1-2.com
  const uppercaseUserId = 'cmjwp0zhn000wgaxo8z2x4wcf'; // Sheffield@5-1-2.com
  const companyId = 'cmjh4zbyb000bju1ets6zrbd2';

  console.log(`Updating Company ${companyId} to link with User ${lowercaseUserId}`);
  
  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      userId: lowercaseUserId
    }
  });

  console.log('Company updated:', updatedCompany.name);

  // Check if the uppercase user has any other companies
  const otherCompanies = await prisma.company.findMany({
    where: { userId: uppercaseUserId }
  });

  if (otherCompanies.length === 0) {
    console.log(`Deleting duplicate capitalized user ${uppercaseUserId}...`);
    await prisma.user.delete({
      where: { id: uppercaseUserId }
    });
    console.log('Duplicate user deleted.');
  } else {
    console.log(`Uppercase user still has ${otherCompanies.length} companies. Skipping delete.`);
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
