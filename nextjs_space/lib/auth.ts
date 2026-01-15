import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface SessionUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
  emailVerified: boolean
}

export async function createSession(user: SessionUser) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
  
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  
  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    
    if (!token) return null
    
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser
    
    // Verify user still exists and is not disabled
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })
    
    if (!user || user.isDisabled) {
      await destroySession()
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireVerifiedUser() {
  const session = await requireAuth()
  if (!session.emailVerified) {
    throw new Error('Email not verified')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (!session.isAdmin) {
    throw new Error('Admin access required')
  }
  return session
}

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create verification code in database
export async function createVerificationCode(email: string): Promise<string> {
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  // Delete old codes for this email
  await prisma.verificationCode.deleteMany({
    where: { email }
  })
  
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt
    }
  })
  
  return code
}

// Verify code
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gt: new Date() }
    }
  })
  
  if (record) {
    // Delete used code
    await prisma.verificationCode.delete({
      where: { id: record.id }
    })
    return true
  }
  
  return false
}