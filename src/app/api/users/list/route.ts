import { users } from '@/lib/appwrite-config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await users.list()
    return NextResponse.json({ users: response.users })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
