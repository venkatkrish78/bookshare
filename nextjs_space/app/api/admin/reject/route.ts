import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'


export async function POST(request: Request) {
  try {
    await requireAdmin()
    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data: { status: 'rejected' },
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Book rejected',
      book
    })
  } catch (error: any) {
    console.error('Reject book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject book' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}