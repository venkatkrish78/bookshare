import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const separator = dbUrl.includes('?') ? '&' : '?'
  const connectionUrl = `${dbUrl}${separator}connection_limit=3&pool_timeout=30`
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Also cache in production
globalForPrisma.prisma = prisma
