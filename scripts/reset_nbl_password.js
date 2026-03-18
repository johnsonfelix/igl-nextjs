const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const email = 'phungtran@nbl-int.com'
  const newPasswordAsString = 'IGL2146'

  console.log(`Resetting password for: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error('User not found')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPasswordAsString, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  console.log('Password reset successfully to IGL2146')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
