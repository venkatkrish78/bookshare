import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth'
import { sendEmail, getWaitlistOfferEmailHtml } from '@/lib/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// POST - Mark loan as returned
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        book: {
          include: {
            owner: true,
            waitlist: {
              where: { status: 'waiting' },
              include: {
                user: true
              },
              orderBy: { position: 'asc' }
            }
          }
        },
        borrower: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Check authorization (borrower, owner, or admin)
    const isAuthorized =
      session.id === loan.borrowerId ||
      session.id === loan.book.ownerId ||
      session.isAdmin

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (loan.status === 'returned') {
      return NextResponse.json(
        { error: 'Loan already marked as returned' },
        { status: 400 }
      )
    }

    // Mark as returned
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: 'returned',
        returnedDate: new Date()
      }
    })

    // Check waitlist and offer to next person
    if (loan.book.waitlist.length > 0) {
      const nextInLine = loan.book.waitlist[0]
      const offerToken = crypto.randomBytes(32).toString('hex')
      const offerExpiresAt = new Date()
      offerExpiresAt.setHours(offerExpiresAt.getHours() + 24) // 24 hours

      await prisma.waitlist.update({
        where: { id: nextInLine.id },
        data: {
          status: 'offered',
          offerToken,
          offerExpiresAt
        }
      })

      // Send email notification
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const acceptUrl = `${appUrl}/offer/${offerToken}?action=accept`
      const declineUrl = `${appUrl}/offer/${offerToken}?action=decline`

      await sendEmail({
        to: nextInLine.user.email,
        subject: `BookShare: "${loan.book.title}" is now available!`,
        html: getWaitlistOfferEmailHtml(
          nextInLine.user.name,
          loan.book.title,
          loan.book.author,
          acceptUrl,
          declineUrl
        )
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Book marked as returned',
      loan: updatedLoan
    })
  } catch (error: any) {
    console.error('Return loan error:', error)
    return NextResponse.json(
      { error: 'Failed to return book' },
      { status: 500 }
    )
  }
}