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
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const appName = 'BookShare'

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        subject,
        body: html,
        is_html: true,
        recipient_email: to,
        sender_email: `noreply@${new URL(appUrl).hostname}`,
        sender_alias: appName,
      }),
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || 'Failed to send email')
    }

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

export function getDueSoonReminderEmailHtml(userName: string, bookTitle: string, dueDate: Date) {
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

export function getOverdueReminderEmailHtml(userName: string, bookTitle: string, dueDate: Date) {
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