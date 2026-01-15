import * as XLSX from 'xlsx'
import { prisma } from './db'

export interface BackupStats {
  totalUsers: number
  totalBooks: number
  activeLoans: number
  pendingRequests: number
  exportDate: string
}

export async function generateBackupData(): Promise<{ buffer: Buffer; stats: BackupStats; filename: string }> {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  
  // Fetch all data
  const [users, books, loans, waitlistEntries] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.book.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.loan.findMany({
      include: {
        book: { 
          select: { 
            title: true, 
            author: true,
            owner: { select: { id: true, name: true, email: true } }
          } 
        },
        borrower: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.waitlist.findMany({
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  // Calculate stats
  const stats: BackupStats = {
    totalUsers: users.length,
    totalBooks: books.length,
    activeLoans: loans.filter((l: any) => l.status === 'active' || l.status === 'overdue').length,
    pendingRequests: waitlistEntries.filter((w: any) => w.status === 'waiting' || w.status === 'offered').length,
    exportDate: now.toISOString()
  }

  // Format Users sheet
  const usersData = users.map((u: any) => ({
    'ID': u.id,
    'Name': u.name,
    'Email': u.email,
    'Role': u.isAdmin ? 'Admin' : 'User',
    'Email Verified': u.emailVerified ? 'Yes' : 'No',
    'Disabled': u.isDisabled ? 'Yes' : 'No',
    'Created At': formatDate(u.createdAt)
  }))

  // Format Books sheet
  const booksData = books.map((b: any) => ({
    'ID': b.id,
    'Title': b.title,
    'Author': b.author,
    'ISBN': b.isbn || '',
    'Category': b.category?.name || '',
    'Condition': b.condition || '',
    'Description': b.description || '',
    'Owner ID': b.ownerId,
    'Owner Name': b.owner?.name || '',
    'Owner Email': b.owner?.email || '',
    'Status': b.status,
    'Cover URL': b.coverUrl || '',
    'Created At': formatDate(b.createdAt)
  }))

  // Format Loans sheet
  const loansData = loans.map((l: any) => ({
    'ID': l.id,
    'Book ID': l.bookId,
    'Book Title': l.book?.title || '',
    'Book Author': l.book?.author || '',
    'Borrower ID': l.borrowerId,
    'Borrower Name': l.borrower?.name || '',
    'Borrower Email': l.borrower?.email || '',
    'Owner ID': l.book?.owner?.id || '',
    'Owner Name': l.book?.owner?.name || '',
    'Owner Email': l.book?.owner?.email || '',
    'Start Date': formatDate(l.startDate),
    'Due Date': formatDate(l.dueDate),
    'Returned Date': l.returnedDate ? formatDate(l.returnedDate) : '',
    'Status': l.status,
    'Last Reminder Sent': l.lastReminderSent ? formatDate(l.lastReminderSent) : '',
    'Reminder Count': l.reminderCount,
    'Created At': formatDate(l.createdAt)
  }))

  // Format Requests (Waitlist) sheet
  const requestsData = waitlistEntries.map((w: any) => ({
    'ID': w.id,
    'Book ID': w.bookId,
    'Book Title': w.book?.title || '',
    'Book Author': w.book?.author || '',
    'Requester ID': w.userId,
    'Requester Name': w.user?.name || '',
    'Requester Email': w.user?.email || '',
    'Position': w.position,
    'Status': w.status,
    'Offer Expires At': w.offerExpiresAt ? formatDate(w.offerExpiresAt) : '',
    'Offer Token': w.offerToken || '',
    'Created At': formatDate(w.createdAt)
  }))

  // Format Metadata sheet
  const metadataData = [
    { 'Field': 'Export Date', 'Value': formatDate(now) },
    { 'Field': 'Export Time (UTC)', 'Value': now.toISOString() },
    { 'Field': 'Total Users', 'Value': stats.totalUsers.toString() },
    { 'Field': 'Total Books', 'Value': stats.totalBooks.toString() },
    { 'Field': 'Active Loans', 'Value': stats.activeLoans.toString() },
    { 'Field': 'Pending Requests', 'Value': stats.pendingRequests.toString() },
    { 'Field': 'Application', 'Value': 'BookShare' },
    { 'Field': 'Environment', 'Value': process.env.NODE_ENV || 'production' }
  ]

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Add sheets
  const usersSheet = XLSX.utils.json_to_sheet(usersData)
  const booksSheet = XLSX.utils.json_to_sheet(booksData)
  const loansSheet = XLSX.utils.json_to_sheet(loansData)
  const requestsSheet = XLSX.utils.json_to_sheet(requestsData)
  const metadataSheet = XLSX.utils.json_to_sheet(metadataData)

  // Set column widths
  setColumnWidths(usersSheet, [20, 25, 35, 10, 15, 10, 25])
  setColumnWidths(booksSheet, [20, 30, 25, 15, 15, 15, 30, 20, 25, 35, 12, 12, 50, 25])
  setColumnWidths(loansSheet, [20, 20, 30, 25, 20, 25, 35, 20, 25, 35, 25, 25, 25, 12, 25, 15, 25])
  setColumnWidths(requestsSheet, [20, 20, 30, 25, 20, 25, 35, 10, 12, 25, 25, 40, 25])
  setColumnWidths(metadataSheet, [25, 50])

  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users')
  XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books')
  XLSX.utils.book_append_sheet(workbook, loansSheet, 'Loans')
  XLSX.utils.book_append_sheet(workbook, requestsSheet, 'Requests')
  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return {
    buffer,
    stats,
    filename: `bookshare-backup-${dateStr}.xlsx`
  }
}

export function generateBackupFilenameWithTime(): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().substring(0, 5).replace(':', '')
  return `bookshare-backup-${dateStr}-${timeStr}.xlsx`
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet['!cols'] = widths.map(w => ({ wch: w }))
}

export function getBackupEmailHtml(stats: BackupStats): string {
  const exportDate = new Date(stats.exportDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📚 BookShare Weekly Backup</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Hi Admin,</p>
        
        <p>This is your weekly automated backup of the BookShare database.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6366f1;">📊 Export Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Export Date:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${exportDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Total Users:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${stats.totalUsers}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Total Books:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${stats.totalBooks}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Active Loans:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${stats.activeLoans}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Pending Requests:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${stats.pendingRequests}</td>
            </tr>
          </table>
        </div>
        
        <p>The attached Excel file contains all data across multiple sheets:</p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li><strong>Users</strong> - All registered users</li>
          <li><strong>Books</strong> - Complete book catalog</li>
          <li><strong>Loans</strong> - All loan records</li>
          <li><strong>Requests</strong> - Waitlist/request entries</li>
          <li><strong>Metadata</strong> - Export summary</li>
        </ul>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">⚠️ <strong>Security Notice:</strong> Please store this file securely as it contains user information.</p>
        </div>
        
        <p style="margin-bottom: 0;">Best regards,<br><strong>BookShare System</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>This is an automated email from BookShare.</p>
      </div>
    </body>
    </html>
  `
}

export function getBackupErrorEmailHtml(error: string): string {
  const errorDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ BookShare Backup Failed</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Hi Admin,</p>
        
        <p>The weekly automated backup for BookShare failed to complete.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Details</h3>
          <p style="margin-bottom: 0;"><strong>Time:</strong> ${errorDate}</p>
          <p style="margin-bottom: 0;"><strong>Error:</strong> ${error}</p>
        </div>
        
        <p>Please check the application logs for more details or try running a manual backup from the Admin panel.</p>
        
        <p style="margin-bottom: 0;">Best regards,<br><strong>BookShare System</strong></p>
      </div>
    </body>
    </html>
  `
}
