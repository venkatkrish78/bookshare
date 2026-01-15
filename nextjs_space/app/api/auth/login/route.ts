import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession, createVerificationCode } from '@/lib/auth'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'


export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    if (user.isDisabled) {
      return NextResponse.json(
        { error: 'Your account has been disabled. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Always require verification code for every login
    const code = await createVerificationCode(email)
    await sendEmail({
      to: email,
      subject: 'Verify your email - BookShare',
      html: getVerificationEmailHtml(code, user.name)
    })

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      needsVerification: true,
      userId: user.id
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}