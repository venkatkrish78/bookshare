import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  sendEmail, 
  getDueSoonReminderEmailHtml,
  getDueTodayReminderEmailHtml,
  getOverdue2DaysReminderEmailHtml,
  getOverdue7DaysReminderEmailHtml,
  LoanReminderData
} from '@/lib/email'

export const dynamic = 'force-dynamic'

// Helper to check if reminder was sent today
function wasSentToday(lastReminderSent: Date | null): boolean {
  if (!lastReminderSent) return false
  const today = new Date()
  return (
    lastReminderSent.getFullYear() === today.getFullYear() &&
    lastReminderSent.getMonth() === today.getMonth() &&
    lastReminderSent.getDate() === today.getDate()
  )
}

// Calculate days until due (negative means overdue)
function getDaysUntilDue(dueDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET(request: Request) {
  try {
    // Auth check using secret key
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const appUrl = process.env.APP_HOSTNAME ? `https://${process.env.APP_HOSTNAME}` : 'https://bookshare.abacusai.app'
    const profileUrl = `${appUrl}/profile`

    // Find all active loans (not returned)
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: { in: ['active', 'overdue'] },
        returnedDate: null
      },
      include: {
        book: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        borrower: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const results = {
      processed: 0,
      dueSoon: 0,
      dueToday: 0,
      overdue2Days: 0,
      overdue7Days: 0,
      statusUpdated: 0,
      errors: [] as string[]
    }

    for (const loan of activeLoans) {
      try {
        const daysUntilDue = getDaysUntilDue(loan.dueDate)
        const alreadySentToday = wasSentToday(loan.lastReminderSent)
        
        // Prepare email data
        const emailData: LoanReminderData = {
          borrowerName: loan.borrower.name,
          borrowerEmail: loan.borrower.email,
          lenderName: loan.book.owner.name,
          lenderEmail: loan.book.owner.email,
          bookTitle: loan.book.title,
          bookAuthor: loan.book.author,
          borrowedDate: loan.startDate,
          dueDate: loan.dueDate,
          profileUrl
        }

        let emailSent = false
        let emailSubject = ''
        let emailHtml = ''

        // Determine which reminder to send
        if (daysUntilDue === 2 && !alreadySentToday) {
          // 2 days before due date
          emailSubject = `Reminder: "${loan.book.title}" due in 2 days`
          emailHtml = getDueSoonReminderEmailHtml(emailData)
          results.dueSoon++
          emailSent = true
        } else if (daysUntilDue === 0 && !alreadySentToday) {
          // Due today
          emailSubject = `"${loan.book.title}" is due today`
          emailHtml = getDueTodayReminderEmailHtml(emailData)
          results.dueToday++
          emailSent = true
        } else if (daysUntilDue === -2 && !alreadySentToday) {
          // 2 days overdue
          emailSubject = `"${loan.book.title}" is overdue`
          emailHtml = getOverdue2DaysReminderEmailHtml(emailData)
          results.overdue2Days++
          emailSent = true
        } else if (daysUntilDue === -7 && !alreadySentToday) {
          // 7 days overdue
          emailSubject = `Urgent: "${loan.book.title}" is 7 days overdue`
          emailHtml = getOverdue7DaysReminderEmailHtml(emailData)
          results.overdue7Days++
          emailSent = true
        }

        // Send email if needed
        if (emailSent && emailHtml) {
          // Send to borrower
          await sendEmail({
            to: loan.borrower.email,
            subject: emailSubject,
            html: emailHtml
          })

          // Send CC to lender (owner)
          await sendEmail({
            to: loan.book.owner.email,
            subject: `[CC] ${emailSubject}`,
            html: emailHtml
          })

          // Update loan reminder tracking
          await prisma.loan.update({
            where: { id: loan.id },
            data: {
              lastReminderSent: new Date(),
              reminderCount: { increment: 1 }
            }
          })

          results.processed++
        }

        // Update status to overdue if past due date
        if (daysUntilDue < 0 && loan.status !== 'overdue') {
          await prisma.loan.update({
            where: { id: loan.id },
            data: { status: 'overdue' }
          })
          results.statusUpdated++
        }
      } catch (loanError: any) {
        console.error(`Error processing loan ${loan.id}:`, loanError)
        results.errors.push(`Loan ${loan.id}: ${loanError.message}`)
        // Continue processing other loans
      }
    }

    console.log('Reminder cron job completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Reminders processed successfully',
      ...results
    })
  } catch (error: any) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders', details: error.message },
      { status: 500 }
    )
  }
}

// Also support POST for cron services that use POST
export async function POST(request: Request) {
  return GET(request)
}
