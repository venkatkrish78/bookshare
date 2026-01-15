import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createVerificationCode } from '@/lib/auth'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but not verified, resend verification code
      if (!existingUser.emailVerified) {
        const code = await createVerificationCode(email)
        await sendEmail({
          to: email,
          subject: 'Verify your email - BookShare',
          html: getVerificationEmailHtml(code, name)
        })
        return NextResponse.json({
          success: true,
          message: 'Verification code sent to your email',
          userId: existingUser.id
        })
      }
      return NextResponse.json(
        { error: 'User already exists and is verified. Please login.' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: false
      }
    })

    // Generate and send verification code
    const code = await createVerificationCode(email)
    await sendEmail({
      to: email,
      subject: 'Verify your email - BookShare',
      html: getVerificationEmailHtml(code, name)
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Check your email for verification code.',
      userId: user.id
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}