const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'info@alburaqcargo.co.uk';
  
  console.log(`Checking for user with email: ${oldEmail}`);
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

  if (user) {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('User not found in User table.');
  }

  console.log('\nChecking for location with email:', oldEmail);
  const locations = await prisma.location.findMany({
    where: { email: oldEmail },
    include: {
      company: true
    }
  });

  if (locations.length > 0) {
    console.log('Locations found:');
    console.log(JSON.stringify(locations, null, 2));
  } else {
    console.log('No locations found with this email.');
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
