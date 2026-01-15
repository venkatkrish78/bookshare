import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - Get book details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: session?.isAdmin ? true : false
          }
        },
        loans: {
          where: { status: 'active' },
          include: {
            borrower: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        waitlist: {
          where: { status: 'waiting' },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ book })
  } catch (error: any) {
    console.error('Get book error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

// PATCH - Update book (owner or admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const book = await prisma.book.findUnique({
      where: { id }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (book.ownerId !== session.id && !session.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Only allow certain fields to be updated by owner
    const allowedFields = ['title', 'author', 'categoryId', 'condition', 'description', 'status']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      book: updatedBook
    })
  } catch (error: any) {
    console.error('Update book error:', error)
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}

// DELETE - Delete book (owner or admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        loans: { where: { status: 'active' } }
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (book.ownerId !== session.id && !session.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Don't allow deletion if book has active loan
    if (book.loans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete book with active loans' },
        { status: 400 }
      )
    }

    await prisma.book.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete book error:', error)
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    )
  }
}