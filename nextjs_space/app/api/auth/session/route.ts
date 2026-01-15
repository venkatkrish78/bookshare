import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({ session })
  } catch (error) {
    return NextResponse.json({ session: null })
  }
}