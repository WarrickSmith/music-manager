import { users } from '@/lib/appwrite-config'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, labels } = body

    if (!userId || !labels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await users.updateLabels(userId, labels)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
