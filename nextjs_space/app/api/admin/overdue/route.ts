import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'


export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: 'active',
        dueDate: { lt: new Date() }
      },
      include: {
        book: {
          include: {
            category: true,
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
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({ loans: overdueLoans })
  } catch (error: any) {
    console.error('Get overdue loans error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch overdue loans' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}