import { NextResponse } from 'next/server'
import { ID } from 'appwrite'
import { account, users } from '@/lib/appwrite-config'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    // Create user account using client SDK
    const user = await account.create(ID.unique(), email, password, name)

    // Set admin label using server SDK
    await users.updateLabels(user.$id, ['admin'])

    // Create session for the new user
    await account.createEmailPasswordSession(email, password)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
