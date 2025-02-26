import { users } from '@/lib/appwrite-config'
import { NextRequest, NextResponse } from 'next/server'
import { deleteUserWithRelatedData } from '@/lib/utils'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Delete related data first (music files, etc.)
    const deleteResults = await deleteUserWithRelatedData(userId)

    // Then delete the user account
    await users.delete(userId)

    return NextResponse.json({
      success: true,
      deletedRelatedData: deleteResults,
    })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
