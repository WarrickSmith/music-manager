import { users } from '@/lib/appwrite-config'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, labels } = body

    if (!userIds?.length || !labels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await Promise.all(
      userIds.map((userId: string) => users.updateLabels(userId, labels))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user roles:', error)
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds } = body

    if (!userIds?.length) {
      return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 })
    }

    await Promise.all(userIds.map((userId: string) => users.delete(userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete users:', error)
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    )
  }
}
