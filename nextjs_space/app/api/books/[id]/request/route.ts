import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireVerifiedUser } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// POST - Request a book
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireVerifiedUser()

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

    if (book.status !== 'approved') {
      return NextResponse.json(
        { error: 'Book is not available' },
        { status: 400 }
      )
    }

    if (book.ownerId === session.id) {
      return NextResponse.json(
        { error: 'You cannot borrow your own book' },
        { status: 400 }
      )
    }

    // Check if book is already on loan
    if (book.loans.length > 0) {
      return NextResponse.json(
        { error: 'Book is currently on loan. Please join the waitlist.' },
        { status: 400 }
      )
    }

    // Check if user already has an active loan for this book
    const existingLoan = await prisma.loan.findFirst({
      where: {
        bookId: id,
        borrowerId: session.id,
        status: 'active'
      }
    })

    if (existingLoan) {
      return NextResponse.json(
        { error: 'You already have an active loan for this book' },
        { status: 400 }
      )
    }

    // Create loan (21 days)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 21)

    const loan = await prisma.loan.create({
      data: {
        bookId: id,
        borrowerId: session.id,
        dueDate,
        status: 'active'
      },
      include: {
        book: true,
        borrower: {
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
      message: 'Book borrowed successfully!',
      loan
    })
  } catch (error: any) {
    console.error('Request book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to request book' },
      { status: 500 }
    )
  }
}