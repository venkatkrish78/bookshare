import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession, requireVerifiedUser } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - List books (public, only approved books)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'approved'

    const where: any = {
      status: status === 'all' ? undefined : status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.categoryId = category
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        },
        loans: {
          where: { status: 'active' },
          include: {
            borrower: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        waitlist: {
          where: { status: 'waiting' },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ books })
  } catch (error: any) {
    console.error('Get books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

// POST - Create new book listing
export async function POST(request: Request) {
  try {
    const session = await requireVerifiedUser()
    const { title, author, categoryId, condition, description } = await request.json()

    if (!title || !author || !categoryId) {
      return NextResponse.json(
        { error: 'Title, author, and category are required' },
        { status: 400 }
      )
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        categoryId,
        condition,
        description,
        ownerId: session.id,
        status: 'pending'
      },
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Book submitted for approval',
      book
    })
  } catch (error: any) {
    console.error('Create book error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create book' },
      { status: 500 }
    )
  }
}