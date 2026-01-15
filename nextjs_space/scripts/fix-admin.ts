import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Only venkatkrish78@gmail.com should be admin
  const correctAdminEmail = 'venkatkrish78@gmail.com'
  
  // Get all current admins
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true, isAdmin: true }
  })
  
  console.log('Current admins:', admins)
  
  // Remove admin from anyone who isn't the correct admin
  for (const admin of admins) {
    if (admin.email !== correctAdminEmail) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { isAdmin: false }
      })
      console.log(`Removed admin role from: ${admin.email}`)
    }
  }
  
  // Ensure correct admin has admin role
  await prisma.user.upsert({
    where: { email: correctAdminEmail },
    update: { isAdmin: true },
    create: {
      email: correctAdminEmail,
      name: 'Admin',
      emailVerified: true,
      isAdmin: true
    }
  })
  
  console.log(`Ensured ${correctAdminEmail} is admin`)
  
  // Show final state
  const finalAdmins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true, isAdmin: true }
  })
  console.log('Final admins:', finalAdmins)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
