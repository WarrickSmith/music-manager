'use server'

import { Client, Users, Account } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/auth-service'

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const users = new Users(client)

export async function getAllUsers() {
  try {
    const usersList = await users.list()

    // Enhance user objects with additional info like role
    const enhancedUsers = await Promise.all(
      usersList.users.map(async (user) => {
        try {
          // Get user labels (roles)
          const isAdmin = user.labels?.includes('admin') || false

          // Try to get user preferences for name info
          let firstName = '',
            lastName = ''
          try {
            const prefs = await users.getPrefs(user.$id)
            firstName = prefs.firstName || ''
            lastName = prefs.lastName || ''
          } catch {
            // Ignore errors when getting prefs
          }

          return {
            ...user,
            isAdmin,
            firstName,
            lastName,
          }
        } catch {
          // Return basic user if enhancement fails
          return {
            ...user,
            isAdmin: false,
          }
        }
      })
    )

    return enhancedUsers
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'competitor'
) {
  try {
    // Get current user data
    const user = await users.get(userId)

    // Create new labels array based on role
    const newLabels =
      user.labels?.filter(
        (label) => label !== 'admin' && label !== 'competitor'
      ) || []
    newLabels.push(role)

    // Update user labels
    await users.updateLabels(userId, newLabels)

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    throw new Error('Failed to update user role')
  }
}

export async function updateUserStatus(userId: string, active: boolean) {
  try {
    if (active) {
      await users.updateStatus(userId, true)
    } else {
      await users.updateStatus(userId, false)
    }

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error updating user status:', error)
    throw new Error('Failed to update user status')
  }
}

export async function deleteUser(userId: string) {
  try {
    await users.delete(userId)

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}

export async function getCurrentUserProfile() {
  try {
    // Get the current user session
    const { userId } = await getServerSession()

    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Get user data
    const user = await users.get(userId)

    // Get user preferences
    let preferences: { firstName?: string; lastName?: string } = {}
    try {
      preferences = await users.getPrefs(userId)
    } catch (error) {
      // Handle case where preferences don't exist yet
      console.error('Error getting user preferences:', error)
      preferences = {}
    }

    return {
      ...user,
      firstName: preferences.firstName || '',
      lastName: preferences.lastName || '',
      // Get phone from the user object instead of preferences
      phone: user.phone || '',
    }
  } catch (error) {
    console.error('Error getting current user profile:', error)
    throw new Error('Failed to fetch user profile')
  }
}

export async function getServerSession() {
  // Get the current user from the auth service
  const user = await getCurrentUser()

  if (!user) {
    return { userId: null }
  }

  return { userId: user.$id }
}

export async function updateUserProfile({
  firstName,
  lastName,
  phone,
}: {
  firstName: string
  lastName: string
  phone: string
}) {
  try {
    // Get the current user session
    const { userId } = await getServerSession()

    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Update user preferences for first name and last name
    await users.updatePrefs(userId, {
      firstName,
      lastName,
    })

    // Update phone number using the dedicated method
    if (phone) {
      try {
        await users.updatePhone(userId, phone)
      } catch (phoneError) {
        console.error('Error updating phone:', phoneError)
        // Continue even if phone update fails
        // This allows other profile updates to succeed
      }
    }

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update profile')
  }
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}) {
  try {
    // Get the current user session
    const { userId } = await getServerSession()

    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Verify the current password first
    try {
      // Get the user's email
      const user = await users.get(userId)

      // Create a temporary client and account instance for verification
      const tempClient = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!)

      const account = new Account(tempClient)

      // Try to create a session with the current password to verify it
      await account.createEmailPasswordSession(user.email, currentPassword)

      // If we get here, the password is correct, so we can update it
      // Use the Users API to update the password (which has the proper permissions)
      await users.updatePassword(userId, newPassword)

      revalidatePath('/admin/dashboard')
      return true
    } catch (error) {
      console.error('Error during password verification:', error)
      throw new Error('Current password is incorrect')
    }
  } catch (error) {
    console.error('Error changing password:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to change password'
    )
  }
}
