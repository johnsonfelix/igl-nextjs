const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const oldEmail = 'ben@nblog.net.cn'
  const newEmail = 'phungtran@nbl-int.com'
  const companyName = 'NBL Logistics'

  console.log(`Searching for company: ${companyName}`)

  const company = await prisma.company.findFirst({
    where: {
      name: {
        contains: companyName,
        mode: 'insensitive'
      }
    },
    include: {
      user: true,
      location: true
    }
  })

  if (!company) {
    console.error('Company not found')
    process.exit(1)
  }

  console.log(`Found Company ID: ${company.id}`)

  // 1. Update User Email (for login)
  if (company.userId) {
    console.log(`Updating user ${company.userId} email from ${company.user.email} to ${newEmail}`)
    await prisma.user.update({
      where: { id: company.userId },
      data: { email: newEmail }
    })
    console.log('User updated successfully')
  } else {
    console.log('No user associated with this company')
  }

  // 2. Update Location Email
  if (company.location) {
    console.log(`Updating location ${company.location.id} email from ${company.location.email} to ${newEmail}`)
    await prisma.location.update({
      where: { id: company.location.id },
      data: { email: newEmail }
    })
    console.log('Location updated successfully')
  } else {
    console.log('No location associated with this company')
  }

  console.log('Database update complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
