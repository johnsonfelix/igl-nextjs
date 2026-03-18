const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const email = 'sheffield@5-1-2.com';
  const companyName = '512 Doncaster';

  console.log(`Checking user with email: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      companies: true
    }
  });

  console.log(`Checking company with name: ${companyName}`);
  const companies = await prisma.company.findMany({
    where: {
      name: { contains: companyName, mode: 'insensitive' }
    },
    include: {
      user: true
    }
  });

  const results = { user, companies };
  fs.writeFileSync('investigation_results.json', JSON.stringify(results, null, 2));
  console.log('Results written to investigation_results.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
