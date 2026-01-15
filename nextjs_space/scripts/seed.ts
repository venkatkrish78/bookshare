import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultCategories = [
  'Fiction',
  'Non-Fiction',
  'Technical',
  'Business',
  'Self-Help',
  'Biography',
  'Science',
  'History',
  'Philosophy',
  "Children's Books"
]

async function main() {
  console.log('🌱 Starting seed...')

  // Seed categories
  console.log('📚 Seeding categories...')
  for (const categoryName of defaultCategories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    })
  }
  console.log(`✅ Created ${defaultCategories.length} categories`)

  // Seed admin user from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  
  if (adminEmails.length > 0) {
    console.log('👤 Seeding admin users...')
    for (const email of adminEmails) {
      await prisma.user.upsert({
        where: { email },
        update: { isAdmin: true },
        create: {
          email,
          name: 'Admin',
          emailVerified: true,
          isAdmin: true
        }
      })
      console.log(`✅ Created/updated admin: ${email}`)
    }
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })