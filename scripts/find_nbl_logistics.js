const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findFirst({
    where: {
      name: {
        contains: 'NBL Logistics',
        mode: 'insensitive'
      }
    },
    include: {
      user: true,
      location: true
    }
  })

  if (!company) {
    console.log('Company not found')
    return
  }

  console.log('Found Company:')
  console.log(JSON.stringify(company, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
