import { users, client, ID, Query } from '../appwrite/server'
import { cookies } from 'next/headers'
import { Account, Client } from 'node-appwrite'

// Session management
export async function createSession(email: string, password: string) {
  try {
    // Create a temporary Account instance for authentication
    const account = new Account(client)

    // Use the correct method for email/password login
    const session = await account.createEmailPasswordSession(email, password)

    // Set session cookie
    try {
      const cookieStore = await cookies()
      cookieStore.set('mm-session', session.secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError)
    }

    return session
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Get current session
export async function getCurrentUser() {
  try {
    let sessionValue = null

    // Try to get the session cookie
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('mm-session')
      sessionValue = sessionCookie?.value
    } catch (cookieError) {
      console.error('Error getting cookie:', cookieError)
    }

    // If there's no session cookie or it's empty, return null immediately
    // This avoids trying to create a session client with an invalid session
    if (!sessionValue) {
      return null
    }

    try {
      // Create a new client instance for session-based authentication
      // This avoids the conflict with the API key set in the global client
      const sessionClient = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
        .setProject(process.env.APPWRITE_PROJECT_ID || '')
        .setSession(sessionValue)

      // Create a temporary Account instance for getting the current user
      const account = new Account(sessionClient)

      // Try to verify the session is valid first
      try {
        // We use getSession instead of get() as it's a more targeted check
        // that verifies if the current session is valid
        await account.getSession('current')

        // Only if the session check passes, we try to get the full account
        return await account.get()
      } catch (sessionVerifyError) {
        console.log('Invalid or expired session:', sessionVerifyError)
        // Don't try to delete the cookie here - it can only be done in a Server Action
        // The invalid session will be handled appropriately when users try to access protected routes
        return null
      }
    } catch (sessionError) {
      // If there's an error with the session (e.g., it's invalid or expired),
      // Just log the error and return null, don't try to delete cookies
      console.error('Session error:', sessionError)
      return null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  try {
    // Check if this is the first user (to assign admin role)
    // We do this BEFORE creating the user to avoid race conditions
    let isFirstUser = false
    try {
      const usersList = await users.list([Query.limit(1)])
      isFirstUser = usersList.total === 0
    } catch (error) {
      console.error('Error checking user count:', error)
      // Default to competitor if we can't check
      isFirstUser = false
    }

    // Create the user using the Account class instead of Users
    const account = new Account(client)
    const user = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    )

    // Set user preferences for first name and last name
    await users.updatePrefs(user.$id, {
      firstName,
      lastName,
    })

    // Assign role as label
    const role = isFirstUser ? 'admin' : 'competitor'
    await users.updateLabels(user.$id, [role])

    return user
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

// Logout
export async function logout() {
  try {
    let sessionValue = null

    // Try to get the session cookie
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('mm-session')
      sessionValue = sessionCookie?.value
    } catch (cookieError) {
      console.error('Error getting cookie:', cookieError)
    }

    if (sessionValue) {
      // Create a new client instance for session-based authentication
      const sessionClient = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
        .setProject(process.env.APPWRITE_PROJECT_ID || '')
        .setSession(sessionValue)

      // Create a temporary Account instance for deleting the session
      const account = new Account(sessionClient)
      await account.deleteSession('current')
    }

    // Remove the cookie
    try {
      const cookieStore = await cookies()
      cookieStore.delete('mm-session')
    } catch (cookieError) {
      console.error('Error deleting cookie:', cookieError)
    }
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Get user role
export async function getUserRole(userId: string) {
  try {
    const user = await users.get(userId)
    return user.labels.includes('admin') ? 'admin' : 'competitor'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}
