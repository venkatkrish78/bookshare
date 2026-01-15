import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, getSession } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { name, email, isAdmin, isDisabled } = await request.json()

    // Prevent admin from modifying their own admin status
    const currentUser = await getSession()
    if (currentUser?.id === params.id && isAdmin === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isAdmin === 'boolean' && { isAdmin }),
        ...(typeof isDisabled === 'boolean' && { isDisabled })
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    // Prevent admin from deleting themselves
    const currentUser = await getSession()
    if (currentUser?.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get the user to delete
    const userToDelete = await prisma.user.findUnique({ where: { id: params.id } })
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for owned books with active loans
    const activeLoans = await prisma.loan.findMany({
      where: {
        book: { ownerId: params.id },
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    if (activeLoans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with books that have active loans' },
        { status: 400 }
      )
    }

    // Check if user has active borrowed books
    const borrowedBooks = await prisma.loan.findMany({
      where: {
        borrowerId: params.id,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    if (borrowedBooks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with active borrowed books' },
        { status: 400 }
      )
    }

    // Delete related records
    await prisma.waitlist.deleteMany({ where: { userId: params.id } })
    await prisma.loan.deleteMany({ where: { borrowerId: params.id } })
    await prisma.verificationCode.deleteMany({ where: { email: userToDelete.email } })
    
    // Delete user's books (and their related records)
    const userBooks = await prisma.book.findMany({ where: { ownerId: params.id } })
    for (const book of userBooks) {
      await prisma.waitlist.deleteMany({ where: { bookId: book.id } })
      await prisma.loan.deleteMany({ where: { bookId: book.id } })
    }
    await prisma.book.deleteMany({ where: { ownerId: params.id } })
    
    // Delete the user
    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    )
  }
}
