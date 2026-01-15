import { NextRequest, NextResponse } from 'next/server'
import { generateBackupData, getBackupEmailHtml, getBackupErrorEmailHtml } from '@/lib/backup'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() || 'venkatkrish78@gmail.com'
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('[Backup Cron] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Backup Cron] Starting weekly backup at ${new Date().toISOString()}`)
    
    let backupData
    try {
      backupData = await generateBackupData()
    } catch (genError: any) {
      console.error('[Backup Cron] Failed to generate backup:', genError)
      
      // Send error notification
      await sendBackupErrorEmail(genError.message || 'Unknown error during backup generation')
      
      return NextResponse.json({
        success: false,
        error: 'Backup generation failed',
        details: genError.message
      }, { status: 500 })
    }

    const { buffer, stats, filename } = backupData
    
    // Send email with attachment
    try {
      await sendBackupEmail(buffer, stats, filename)
      
      console.log(`[Backup Cron] Backup email sent successfully to ${ADMIN_EMAIL}`)
      console.log(`[Backup Cron] Stats - Users: ${stats.totalUsers}, Books: ${stats.totalBooks}, Active Loans: ${stats.activeLoans}, Pending Requests: ${stats.pendingRequests}`)
      
      return NextResponse.json({
        success: true,
        message: 'Weekly backup completed and emailed',
        stats,
        sentTo: ADMIN_EMAIL,
        filename
      })
    } catch (emailError: any) {
      console.error('[Backup Cron] Failed to send backup email:', emailError)
      
      return NextResponse.json({
        success: false,
        error: 'Backup generated but email failed',
        stats,
        emailError: emailError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[Backup Cron] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Backup cron failed'
    }, { status: 500 })
  }
}

async function sendBackupEmail(buffer: Buffer, stats: any, filename: string) {
  const APP_HOSTNAME = process.env.APP_HOSTNAME || 'bookshare.abacusai.app'
  const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY
  
  if (!ABACUS_API_KEY) {
    throw new Error('ABACUSAI_API_KEY not configured')
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const response = await fetch('https://api.abacus.ai/send-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ABACUS-API-KEY': ABACUS_API_KEY
    },
    body: JSON.stringify({
      email_to: ADMIN_EMAIL,
      email_subject: `BookShare Data Backup - ${dateStr}`,
      email_body: getBackupEmailHtml(stats),
      email_from: `BookShare <no-reply@${APP_HOSTNAME}>`,
      attachments: [{
        filename: filename,
        content: buffer.toString('base64'),
        content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        encoding: 'base64'
      }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Email API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function sendBackupErrorEmail(errorMessage: string) {
  const APP_HOSTNAME = process.env.APP_HOSTNAME || 'bookshare.abacusai.app'
  const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY
  
  if (!ABACUS_API_KEY) {
    console.error('[Backup Cron] Cannot send error email - ABACUSAI_API_KEY not configured')
    return
  }

  try {
    await fetch('https://api.abacus.ai/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ABACUS-API-KEY': ABACUS_API_KEY
      },
      body: JSON.stringify({
        email_to: ADMIN_EMAIL,
        email_subject: 'BookShare Backup Failed - Action Required',
        email_body: getBackupErrorEmailHtml(errorMessage),
        email_from: `BookShare <no-reply@${APP_HOSTNAME}>`
      })
    })
  } catch (e) {
    console.error('[Backup Cron] Failed to send error notification email:', e)
  }
}
