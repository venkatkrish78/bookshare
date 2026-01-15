import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - List user's loans
export async function GET(request: Request) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'borrowed' // borrowed or lent

    const where: any = type === 'borrowed'
      ? { borrowerId: session.id }
      : {
          book: {
            ownerId: session.id
          }
        }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        book: {
          include: {
            category: true,
            owner: {
              select: {
                id: true,
                name: true
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
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ loans })
  } catch (error: any) {
    console.error('Get loans error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loans' },
      { status: 500 }
    )
  }
}