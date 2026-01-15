import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createVerificationCode } from '@/lib/auth'
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

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    const code = await createVerificationCode(email)
    await sendEmail({
      to: email,
      subject: 'Verify your email - BookShare',
      html: getVerificationEmailHtml(code, user.name)
    })

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email'
    })
  } catch (error: any) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Failed to resend code' },
      { status: 500 }
    )
  }
}