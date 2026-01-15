export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const appName = 'BookShare'
    // Use the production hostname for sender email
    const senderDomain = process.env.APP_HOSTNAME || 'bookshare.abacusai.app'

    console.log(`Sending email to ${to} with subject: ${subject}`)

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        subject,
        body: html,
        is_html: true,
        recipient_email: to,
        sender_email: `noreply@${senderDomain}`,
        sender_alias: appName,
      }),
    })

    const result = await response.json()
    console.log('Email API response:', result)
    
    if (!result.success) {
      console.error('Email send failed:', result.message || 'Unknown error')
      throw new Error(result.message || 'Failed to send email')
    }

    console.log(`Email sent successfully to ${to}`)
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export function getVerificationEmailHtml(code: string, name: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
        <p style="color: #666; line-height: 1.6;">Welcome to BookShare! Please verify your email address by entering this code:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</div>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">This code will expire in 15 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `
}

export function getWaitlistOfferEmailHtml(userName: string, bookTitle: string, bookAuthor: string, acceptUrl: string, declineUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Great news, ${userName}!</h2>
        <p style="color: #666; line-height: 1.6;">The book you've been waiting for is now available:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0; color: #666;">by ${bookAuthor}</p>
        </div>
        <p style="color: #666; line-height: 1.6;">You have <strong>24 hours</strong> to accept this offer. Please choose one of the options below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 0 10px; font-weight: bold;">Accept Book</a>
          <a href="${declineUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 0 10px; font-weight: bold;">Decline</a>
        </div>
        <p style="color: #999; font-size: 12px;">If you don't respond within 24 hours, the offer will automatically expire and the book will be offered to the next person in line.</p>
      </div>
    </div>
  `
}

export interface LoanReminderData {
  borrowerName: string
  borrowerEmail: string
  lenderName: string
  lenderEmail: string
  bookTitle: string
  bookAuthor: string
  borrowedDate: Date
  dueDate: Date
  profileUrl: string
}

// 2 days before due date
export function getDueSoonReminderEmailHtml(data: LoanReminderData) {
  const { borrowerName, lenderName, bookTitle, bookAuthor, borrowedDate, dueDate, profileUrl } = data
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">📅 Reminder: Book Due in 2 Days</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${borrowerName},</p>
        <p style="color: #666; line-height: 1.6;">This is a friendly reminder that the book you borrowed from <strong>${lenderName}</strong> is due in 2 days.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">by ${bookAuthor}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Borrowed on:</strong> ${borrowedDate.toLocaleDateString()}</p>
          <p style="margin: 0; color: #666; font-size: 14px;"><strong>Due date:</strong> ${dueDate.toLocaleDateString()}</p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book to ${lenderName} by the due date, or mark it as returned in the app once you've handed it over.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View My Loans</a>
        </div>
        <p style="color: #666; line-height: 1.6;">Thank you for participating in our book sharing community!</p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Best,<br>BookShare Team</p>
      </div>
    </div>
  `
}

// On due date
export function getDueTodayReminderEmailHtml(data: LoanReminderData) {
  const { borrowerName, lenderName, bookTitle, bookAuthor, borrowedDate, dueDate, profileUrl } = data
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">⏰ "${bookTitle}" is Due Today</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${borrowerName},</p>
        <p style="color: #666; line-height: 1.6;">This is a friendly reminder that the book you borrowed from <strong>${lenderName}</strong> is due <strong>today</strong>.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">by ${bookAuthor}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Borrowed on:</strong> ${borrowedDate.toLocaleDateString()}</p>
          <p style="margin: 0; color: #ea580c; font-size: 14px;"><strong>Due date:</strong> ${dueDate.toLocaleDateString()} (TODAY)</p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book to ${lenderName} today to avoid it becoming overdue.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View My Loans</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Best,<br>BookShare Team</p>
      </div>
    </div>
  `
}

// 2 days overdue
export function getOverdue2DaysReminderEmailHtml(data: LoanReminderData) {
  const { borrowerName, lenderName, bookTitle, bookAuthor, borrowedDate, dueDate, profileUrl } = data
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">⚠️ "${bookTitle}" is Overdue</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${borrowerName},</p>
        <p style="color: #666; line-height: 1.6;">The book you borrowed from <strong>${lenderName}</strong> is now <strong>2 days overdue</strong>.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">by ${bookAuthor}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Borrowed on:</strong> ${borrowedDate.toLocaleDateString()}</p>
          <p style="margin: 0; color: #dc2626; font-size: 14px;"><strong>Was due:</strong> ${dueDate.toLocaleDateString()} (2 days ago)</p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book to ${lenderName} as soon as possible. Other community members may be waiting!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View My Loans</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Best,<br>BookShare Team</p>
      </div>
    </div>
  `
}

// 7 days overdue - urgent
export function getOverdue7DaysReminderEmailHtml(data: LoanReminderData) {
  const { borrowerName, lenderName, bookTitle, bookAuthor, borrowedDate, dueDate, profileUrl } = data
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #7f1d1d; margin-top: 0;">🚨 URGENT: "${bookTitle}" is 7 Days Overdue</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${borrowerName},</p>
        <p style="color: #666; line-height: 1.6;">The book you borrowed from <strong>${lenderName}</strong> is now <strong>7 days overdue</strong>. This is an urgent request to return the book immediately.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7f1d1d;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">by ${bookAuthor}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Borrowed on:</strong> ${borrowedDate.toLocaleDateString()}</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: bold;"><strong>Was due:</strong> ${dueDate.toLocaleDateString()} (7 days ago)</p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book to ${lenderName} immediately or contact them if you need to discuss an extension.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #7f1d1d; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View My Loans</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Best,<br>BookShare Team</p>
      </div>
    </div>
  `
}

// Legacy function for backwards compatibility
export function getDueSoonReminderEmailHtmlLegacy(userName: string, bookTitle: string, dueDate: Date) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Reminder: Book Due Soon</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #666; line-height: 1.6;">This is a friendly reminder that your borrowed book is due soon:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0; color: #666;">Due date: <strong>${dueDate.toLocaleDateString()}</strong></p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book by the due date to avoid it becoming overdue.</p>
      </div>
    </div>
  `
}

export function getOverdueReminderEmailHtmlLegacy(userName: string, bookTitle: string, dueDate: Date) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📚 BookShare</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">⚠️ Overdue Book Notice</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #666; line-height: 1.6;">Your borrowed book is now overdue:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${bookTitle}</h3>
          <p style="margin: 0; color: #666;">Was due: <strong>${dueDate.toLocaleDateString()}</strong></p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please return the book as soon as possible. Other community members may be waiting!</p>
      </div>
    </div>
  `
}