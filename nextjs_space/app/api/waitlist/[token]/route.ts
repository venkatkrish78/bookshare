import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { sendEmail, getWaitlistOfferEmailHtml } from '@/lib/email'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// POST - Accept or decline offer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { action } = await request.json() // 'accept' or 'decline'

    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { offerToken: token },
      include: {
        book: {
          include: {
            loans: { where: { status: 'active' } }
          }
        },
        user: true
      }
    })

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: 'Invalid or expired offer' },
        { status: 404 }
      )
    }

    if (waitlistEntry.status !== 'offered') {
      return NextResponse.json(
        { error: 'Offer is no longer valid' },
        { status: 400 }
      )
    }

    // Check if offer has expired
    if (waitlistEntry.offerExpiresAt && new Date() > waitlistEntry.offerExpiresAt) {
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: { status: 'expired' }
      })
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Check if book is still available
      if (waitlistEntry.book.loans.length > 0) {
        return NextResponse.json(
          { error: 'Book is no longer available' },
          { status: 400 }
        )
      }

      // Create loan
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 21)

      const loan = await prisma.loan.create({
        data: {
          bookId: waitlistEntry.bookId,
          borrowerId: waitlistEntry.userId,
          dueDate,
          status: 'active'
        }
      })

      // Update waitlist entry
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: { status: 'accepted' }
      })

      return NextResponse.json({
        success: true,
        message: 'Book borrowed successfully!',
        loan
      })
    } else if (action === 'decline') {
      // Mark as declined
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: { status: 'declined' }
      })

      // Offer to next person in waitlist
      const nextInLine = await prisma.waitlist.findFirst({
        where: {
          bookId: waitlistEntry.bookId,
          status: 'waiting'
        },
        include: {
          user: true,
          book: true
        },
        orderBy: { position: 'asc' }
      })

      if (nextInLine) {
        const offerToken = crypto.randomBytes(32).toString('hex')
        const offerExpiresAt = new Date()
        offerExpiresAt.setHours(offerExpiresAt.getHours() + 24)

        await prisma.waitlist.update({
          where: { id: nextInLine.id },
          data: {
            status: 'offered',
            offerToken,
            offerExpiresAt
          }
        })

        // Send email
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const acceptUrl = `${appUrl}/offer/${offerToken}?action=accept`
        const declineUrl = `${appUrl}/offer/${offerToken}?action=decline`

        await sendEmail({
          to: nextInLine.user.email,
          subject: `BookShare: "${nextInLine.book.title}" is now available!`,
          html: getWaitlistOfferEmailHtml(
            nextInLine.user.name,
            nextInLine.book.title,
            nextInLine.book.author,
            acceptUrl,
            declineUrl
          )
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Offer declined'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Handle offer error:', error)
    return NextResponse.json(
      { error: 'Failed to process offer' },
      { status: 500 }
    )
  }
}