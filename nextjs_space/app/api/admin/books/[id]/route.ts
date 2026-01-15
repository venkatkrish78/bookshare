import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { title, author, categoryId, condition, status } = await request.json()

    const book = await prisma.book.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(categoryId && { categoryId }),
        ...(condition && { condition }),
        ...(status && { status })
      },
      include: {
        owner: { select: { name: true, email: true } },
        category: true
      }
    })

    return NextResponse.json({ success: true, book })
  } catch (error: any) {
    console.error('Update book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update book' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    // Check for active loans
    const activeLoans = await prisma.loan.findMany({
      where: {
        bookId: params.id,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    if (activeLoans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete book with active loans' },
        { status: 400 }
      )
    }

    // Delete related records first
    await prisma.waitlist.deleteMany({ where: { bookId: params.id } })
    await prisma.loan.deleteMany({ where: { bookId: params.id } })
    
    // Delete the book
    await prisma.book.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Book deleted' })
  } catch (error: any) {
    console.error('Delete book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete book' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}
