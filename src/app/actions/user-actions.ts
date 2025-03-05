'use server'

import { Client, Users } from 'node-appwrite'
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
}: {
  firstName: string
  lastName: string
}) {
  try {
    // Get the current user session
    const { userId } = await getServerSession()

    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Update user preferences
    await users.updatePrefs(userId, {
      firstName,
      lastName,
    })

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update profile')
  }
}
