import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateBackupData, generateBackupFilenameWithTime } from '@/lib/backup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const session = await requireAdmin()
    
    console.log(`[Backup] Manual backup initiated by admin: ${session.email}`)
    
    const { buffer, stats } = await generateBackupData()
    const filename = generateBackupFilenameWithTime()
    
    console.log(`[Backup] Manual backup completed - Users: ${stats.totalUsers}, Books: ${stats.totalBooks}, Loans: ${stats.activeLoans}`)
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error: any) {
    console.error('[Backup] Manual backup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate backup' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}
