import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const books = await prisma.book.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        category: true,
        _count: {
          select: { loans: true, waitlist: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ books })
  } catch (error: any) {
    console.error('Get books error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch books' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}
