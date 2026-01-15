import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail, getWaitlistOfferEmailHtml } from '@/lib/email'


export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Simple auth check using a secret key
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find expired offers
    const expiredOffers = await prisma.waitlist.findMany({
      where: {
        status: 'offered',
        offerExpiresAt: { lt: now }
      },
      include: {
        book: {
          include: {
            loans: { where: { status: 'active' } }
          }
        },
        user: true
      }
    })

    let offersProcessed = 0

    for (const expiredOffer of expiredOffers) {
      // Mark as expired
      await prisma.waitlist.update({
        where: { id: expiredOffer.id },
        data: { status: 'expired' }
      })

      // Check if book is still available
      if (expiredOffer.book.loans.length === 0) {
        // Offer to next person in waitlist
        const nextInLine = await prisma.waitlist.findFirst({
          where: {
            bookId: expiredOffer.bookId,
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

          offersProcessed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredOffers.length,
      offersProcessed
    })
  } catch (error: any) {
    console.error('Expire offers error:', error)
    return NextResponse.json(
      { error: 'Failed to expire offers' },
      { status: 500 }
    )
  }
}