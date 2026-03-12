import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'manchester@allseasglobal.com';
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2));
    const company = await prisma.company.findFirst({
        where: { userId: user.id }
    });
    console.log('Company found:', JSON.stringify(company, null, 2));
  } else {
    console.log('User NOT found with email:', email);
    
    // Let's search for similar emails or just list some users to see the format
    const similarUsers = await prisma.user.findMany({
        where: {
            email: {
                contains: 'allseasglobal.com'
            }
        }
    });
    console.log('Similar users:', JSON.stringify(similarUsers, null, 2));
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
