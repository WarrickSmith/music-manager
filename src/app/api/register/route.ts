import { NextResponse } from 'next/server'
import { ID, Query } from 'appwrite'
import { account, users } from '@/lib/appwrite-config'

interface AppwriteError {
  code: number
  message: string
  type?: string
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    // Create user account using client SDK
    const user = await account.create(ID.unique(), email, password, name)

    // Check if this is the first user
    const existingUsers = await users.list([
      Query.limit(1), // We only need to check if any users exist
      Query.notEqual('$id', user.$id), // Exclude the user we just created
    ])

    // Determine the role based on whether other users exist
    const role = existingUsers.total === 0 ? 'admin' : 'competitor'

    // Set the appropriate label using server SDK
    await users.updateLabels(user.$id, [role])

    // Create session for the new user
    await account.createEmailPasswordSession(email, password)

    // Get the updated user to include the role in the response
    const updatedUser = await users.get(user.$id)

    return NextResponse.json({ user: updatedUser })
  } catch (error: unknown) {
    console.error('Registration error:', error)

    // Type guard and error handling
    const appwriteError = error as AppwriteError
    const errorMessage = appwriteError.message || 'Failed to register user'
    const status =
      appwriteError.code >= 400 && appwriteError.code < 600
        ? appwriteError.code
        : 500

    return NextResponse.json({ error: errorMessage }, { status })
  }
}
