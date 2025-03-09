'use server'

import { Client, Users, Account, Models } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/auth-service'
import { databases, Query } from '@/lib/appwrite/server'
import { storage } from '@/lib/appwrite/server'

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const users = new Users(client)
const databaseId = process.env.APPWRITE_DATABASE_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!

/**
 * Utility function to fetch all documents with pagination
 * @param databaseId Database ID
 * @param collectionId Collection ID
 * @param queries Query parameters
 * @returns Array of all documents from all pages
 */
async function getAllDocuments(
  databaseId: string,
  collectionId: string,
  queries: string[] = []
) {
  const limit = 100 // Maximum allowed by Appwrite
  let offset = 0
  let allDocuments: Models.Document[] = [] // Using Appwrite Models.Document type
  let hasMoreDocuments = true

  // Add limit to queries if not already specified
  const queriesWithLimit = [...queries, Query.limit(limit)]

  while (hasMoreDocuments) {
    // Add offset to queries
    const currentQueries = [...queriesWithLimit, Query.offset(offset)]

    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      currentQueries
    )

    allDocuments = [...allDocuments, ...response.documents]

    // Check if there are more documents
    if (response.documents.length < limit) {
      hasMoreDocuments = false
    } else {
      offset += limit
    }
  }

  return allDocuments
}

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
    // The Appwrite SDK expects a boolean for updateStatus
    // true = active, false = blocked
    await users.updateStatus(userId, active)

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error updating user status:', error)
    throw new Error('Failed to update user status')
  }
}

export async function deleteUser(userId: string) {
  try {
    // First, delete all music files associated with this user
    const musicFiles = await getAllDocuments(
      databaseId,
      musicFilesCollectionId,
      [Query.equal('userId', userId)]
    )

    // Delete music files from storage and database
    for (const file of musicFiles) {
      try {
        // Delete file from storage
        await storage.deleteFile(bucketId, file.fileId)
        // Delete file record from database
        await databases.deleteDocument(
          databaseId,
          musicFilesCollectionId,
          file.$id
        )
      } catch (fileError) {
        console.error(`Error deleting music file ${file.$id}:`, fileError)
        // Continue deleting other files even if one fails
      }
    }

    // Delete the user account
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

    // Update the user's full name in the Appwrite authentication system
    // This ensures that name changes in profile are reflected in the auth system
    const fullName = `${firstName} ${lastName}`.trim()
    try {
      await users.updateName(userId, fullName)
    } catch (nameUpdateError) {
      console.error('Error updating user name:', nameUpdateError)
      // Continue with other updates even if this fails
    }

    // Update phone number using the dedicated method
    if (phone) {
      try {
        // Format phone number to ensure it starts with '+'
        let formattedPhone = phone.trim()
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone
        }

        // Validate phone number format
        if (!/^\+[0-9]{1,14}$/.test(formattedPhone)) {
          throw new Error(
            'Phone number must start with + and contain up to 15 digits'
          )
        }

        // Get current user to check if phone number actually changed
        const currentUser = await users.get(userId)

        // Only update phone if it's different from current phone
        if (currentUser.phone !== formattedPhone) {
          try {
            await users.updatePhone(userId, formattedPhone)
          } catch (phoneUpdateError: unknown) {
            // Type-cast to an object with code and message properties
            const error = phoneUpdateError as {
              code?: number
              message?: string
            }
            // Check if this is a conflict error (409)
            if (error?.code === 409) {
              throw new Error(
                'This phone number is already associated with another account'
              )
            }
            // Rethrow other errors
            throw phoneUpdateError
          }
        }
      } catch (phoneError) {
        console.error('Error updating phone:', phoneError)
        // Throw the error to show the toast message
        throw new Error(
          phoneError instanceof Error
            ? phoneError.message
            : 'Phone number must be in international format (e.g., +14155552671)'
        )
      }
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/dashboard') // Also revalidate the competitor dashboard path
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update profile')
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await users.get(userId)
    const prefs = await users.getPrefs(userId)

    return {
      id: user.$id,
      email: user.email,
      name: user.name,
      prefs,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to fetch user profile')
  }
}

/**
 * Update user profile
 */
export async function updateCompetitorProfile(
  userId: string,
  data: {
    name?: string
    prefs?: Record<string, unknown>
  }
) {
  try {
    const updates: Promise<unknown>[] = []

    if (data.name) {
      updates.push(users.updateName(userId, data.name))
    }

    if (data.prefs) {
      // If prefs contains firstName and lastName, also update the full name
      const prefs = data.prefs as { firstName?: string; lastName?: string }
      if (prefs.firstName !== undefined || prefs.lastName !== undefined) {
        // Get current preferences to combine with new values
        const currentPrefs = await users.getPrefs(userId)
        const firstName = prefs.firstName ?? currentPrefs.firstName ?? ''
        const lastName = prefs.lastName ?? currentPrefs.lastName ?? ''

        // Update the full name in the auth system
        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim()
          updates.push(users.updateName(userId, fullName))
        }
      }

      updates.push(users.updatePrefs(userId, data.prefs))
    }

    await Promise.all(updates)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
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
