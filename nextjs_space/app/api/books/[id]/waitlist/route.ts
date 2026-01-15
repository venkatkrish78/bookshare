import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireVerifiedUser } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// POST - Join waitlist
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
        loans: { where: { status: 'active' } },
        waitlist: { where: { status: 'waiting' } }
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
        { error: 'You cannot join waitlist for your own book' },
        { status: 400 }
      )
    }

    // Check if already in waitlist
    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        bookId: id,
        userId: session.id,
        status: { in: ['waiting', 'offered'] }
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'You are already in the waitlist' },
        { status: 400 }
      )
    }

    // Calculate next position
    const nextPosition = book.waitlist.length + 1

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        bookId: id,
        userId: session.id,
        position: nextPosition,
        status: 'waiting'
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Added to waitlist',
      waitlistEntry
    })
  } catch (error: any) {
    console.error('Join waitlist error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}

// DELETE - Leave waitlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireVerifiedUser()

    const waitlistEntry = await prisma.waitlist.findFirst({
      where: {
        bookId: id,
        userId: session.id,
        status: { in: ['waiting', 'offered'] }
      }
    })

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: 'You are not in the waitlist' },
        { status: 404 }
      )
    }

    await prisma.waitlist.delete({
      where: { id: waitlistEntry.id }
    })

    // Reorder remaining waitlist
    const remaining = await prisma.waitlist.findMany({
      where: {
        bookId: id,
        status: 'waiting',
        position: { gt: waitlistEntry.position }
      },
      orderBy: { position: 'asc' }
    })

    for (const entry of remaining) {
      await prisma.waitlist.update({
        where: { id: entry.id },
        data: { position: entry.position - 1 }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from waitlist'
    })
  } catch (error: any) {
    console.error('Leave waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to leave waitlist' },
      { status: 500 }
    )
  }
}