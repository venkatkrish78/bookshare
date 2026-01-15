import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCode, createSession } from '@/lib/auth'


export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Verify the code
    const isValid = await verifyCode(email, code)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      emailVerified: true
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}