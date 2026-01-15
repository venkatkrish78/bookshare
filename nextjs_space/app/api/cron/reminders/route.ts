import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getDueSoonReminderEmailHtml, getOverdueReminderEmailHtml } from '@/lib/email'


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
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    // Find loans due in 2 days (due soon reminders)
    const dueSoonLoans = await prisma.loan.findMany({
      where: {
        status: 'active',
        dueDate: {
          gte: now,
          lte: twoDaysFromNow
        }
      },
      include: {
        book: true,
        borrower: true
      }
    })

    // Send due soon reminders
    for (const loan of dueSoonLoans) {
      await sendEmail({
        to: loan.borrower.email,
        subject: `BookShare: "${loan.book.title}" is due soon`,
        html: getDueSoonReminderEmailHtml(
          loan.borrower.name,
          loan.book.title,
          loan.dueDate
        )
      })
    }

    // Find overdue loans
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: 'active',
        dueDate: { lt: now }
      },
      include: {
        book: true,
        borrower: true
      }
    })

    // Update status to overdue and send reminders
    for (const loan of overdueLoans) {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'overdue' }
      })

      await sendEmail({
        to: loan.borrower.email,
        subject: `BookShare: "${loan.book.title}" is overdue`,
        html: getOverdueReminderEmailHtml(
          loan.borrower.name,
          loan.book.title,
          loan.dueDate
        )
      })
    }

    return NextResponse.json({
      success: true,
      dueSoonCount: dueSoonLoans.length,
      overdueCount: overdueLoans.length
    })
  } catch (error: any) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}