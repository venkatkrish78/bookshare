import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const pendingBooks = await prisma.book.findMany({
      where: { status: 'pending' },
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ books: pendingBooks })
  } catch (error: any) {
    console.error('Get pending books error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending books' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}