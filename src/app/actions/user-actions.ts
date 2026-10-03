'use server'

import { Account, Models } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/auth-service'
import {
  tablesDB,
  storage,
  Query,
  users,
  createProjectClient,
} from '@/lib/appwrite/server'
import { toPlainObject } from '@/lib/utils'
import {
  requireAdmin,
  requireSelfOrAdmin,
  requireUser,
} from '@/lib/auth/guards'
import { describeWait, passwordLimiter } from '@/lib/security/rate-limit'
import { isMissingTableError } from '@/lib/appwrite/rows'

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
  let allDocuments: Models.DefaultRow[] = []
  let hasMoreDocuments = true

  // Add limit to queries if not already specified
  const queriesWithLimit = [...queries, Query.limit(limit)]

  while (hasMoreDocuments) {
    // Add offset to queries
    const currentQueries = [...queriesWithLimit, Query.offset(offset)]

    const response = await tablesDB.listRows({
      databaseId,
      tableId: collectionId,
      queries: currentQueries,
    })

    allDocuments = [...allDocuments, ...response.rows]

    // Check if there are more documents
    if (response.rows.length < limit) {
      hasMoreDocuments = false
    } else {
      offset += limit
    }
  }

  return allDocuments
}

export async function getAllUsers() {
  await requireAdmin()
  try {
    // Appwrite returns 25 users by default, so page through all of them
    const allUsers: Models.User<Models.Preferences>[] = []
    for (let offset = 0; ; offset += 100) {
      const page = await users.list([Query.limit(100), Query.offset(offset)])
      allUsers.push(...page.users)
      if (page.users.length < 100) break
    }
    const usersList = { users: allUsers }

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

    return toPlainObject(enhancedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'competitor'
) {
  const admin = await requireAdmin()
  if (role !== 'admin' && role !== 'competitor') {
    throw new Error('The role must be admin or competitor.')
  }
  // An admin who removes their own role could lock everyone out of admin tools
  if (admin.$id === userId && role !== 'admin') {
    throw new Error('You cannot remove your own admin role. Ask another admin.')
  }
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
  const admin = await requireAdmin()
  if (admin.$id === userId && !active) {
    throw new Error('You cannot switch off your own account.')
  }
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
  const admin = await requireAdmin()
  if (admin.$id === userId) {
    throw new Error('You cannot delete your own account.')
  }
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
        await tablesDB.deleteRow({
          databaseId,
          tableId: musicFilesCollectionId,
          rowId: file.$id,
        })
      } catch (fileError) {
        console.error(`Error deleting music file ${file.$id}:`, fileError)
        // Continue deleting other files even if one fails
      }
    }

    // Remove the skater's entries, if entries are set up
    try {
      const entriesTable =
        process.env.APPWRITE_ENTRIES_COLLECTION_ID || 'entries'
      const entryRows = await getAllDocuments(databaseId, entriesTable, [
        Query.equal('userId', userId),
      ])
      for (const entry of entryRows) {
        await tablesDB.deleteRow({
          databaseId,
          tableId: entriesTable,
          rowId: entry.$id,
        })
      }
    } catch (entryError) {
      if (!isMissingTableError(entryError)) throw entryError
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
  await requireUser()
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

    return toPlainObject({
      ...user,
      firstName: preferences.firstName || '',
      lastName: preferences.lastName || '',
      phone: user.phone || '',
    })
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
  await requireUser()
  if (
    [firstName, lastName].some((v) => typeof v !== 'string' || v.length > 100)
  ) {
    throw new Error('Names can be at most 100 characters.')
  }
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
  await requireSelfOrAdmin(userId)
  try {
    const user = await users.get(userId)
    const prefs = await users.getPrefs(userId)

    return toPlainObject({
      id: user.$id,
      email: user.email,
      name: user.name,
      prefs,
    })
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
  await requireSelfOrAdmin(userId)
  // Only the name fields may be stored. Anything else a caller sends is dropped.
  if (data.prefs) {
    const { firstName, lastName } = data.prefs as {
      firstName?: unknown
      lastName?: unknown
    }
    data = {
      ...data,
      prefs: {
        ...(typeof firstName === 'string' ? { firstName } : {}),
        ...(typeof lastName === 'string' ? { lastName } : {}),
      },
    }
  }
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
  const user = await requireUser()
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('The new password must be at least 8 characters.')
  }

  // Checking the current password is a password-guessing opportunity, so limit it
  const limiter = passwordLimiter()
  const blocked = limiter.status(user.$id)
  if (blocked.blocked) {
    throw new Error(
      `Too many attempts. Try again in ${describeWait(blocked.retryAfterSeconds)}.`
    )
  }

  try {
    const account = await users.get(user.$id)

    // Verify the current password by trying to sign in with it
    const tempAccount = new Account(createProjectClient())
    let session: Models.Session
    try {
      session = await tempAccount.createEmailPasswordSession(
        account.email,
        currentPassword
      )
    } catch {
      limiter.hit(user.$id)
      throw new Error('Current password is incorrect')
    }

    // The check session is not needed; do not leave it open
    await users.deleteSession(user.$id, session.$id).catch((error) => {
      console.error('Could not remove the password check session:', error)
    })

    await users.updatePassword(user.$id, newPassword)
    limiter.reset(user.$id)
    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error changing password:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to change password'
    )
  }
}
