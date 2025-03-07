import { Client, Databases, Storage, Users, ID, Query } from 'node-appwrite'

// Initialize the Appwrite client with proper error handling
function createAppwriteClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    console.error('Missing required Appwrite environment variables')
    throw new Error(
      'Appwrite configuration incomplete. Check your environment variables.'
    )
  }

  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
}

// Create and export service instances with error handling
let _client: Client
try {
  _client = createAppwriteClient()
} catch (error) {
  console.error('Failed to initialize Appwrite client:', error)
  // Set a placeholder client that will throw appropriate errors when used
  _client = new Client()
}

export const client = _client
export const databases = new Databases(client)
export const storage = new Storage(client)
export const users = new Users(client)
export { ID, Query }

// Helper functions for common operations
export async function getCompetitions(active?: boolean) {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID
    const collectionId = process.env.APPWRITE_COMPETITIONS_COLLECTION_ID

    if (!dbId || !collectionId) {
      throw new Error('Missing database or collection configuration')
    }

    const queries = []
    if (typeof active === 'boolean') {
      queries.push(Query.equal('active', active))
    }

    return await databases.listDocuments(dbId, collectionId, queries)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    throw error
  }
}

export async function getGradesForCompetition(competitionId: string) {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID
    const collectionId = process.env.APPWRITE_GRADES_COLLECTION_ID

    if (!dbId || !collectionId) {
      throw new Error('Missing database or collection configuration')
    }

    return await databases.listDocuments(dbId, collectionId, [
      Query.equal('competitionId', competitionId),
    ])
  } catch (error) {
    console.error(
      `Error fetching grades for competition ${competitionId}:`,
      error
    )
    throw error
  }
}

export async function getMusicFilesForUser(userId: string) {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID
    const collectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID

    if (!dbId || !collectionId) {
      throw new Error('Missing database or collection configuration')
    }

    return await databases.listDocuments(dbId, collectionId, [
      Query.equal('userId', userId),
    ])
  } catch (error) {
    console.error(`Error fetching music files for user ${userId}:`, error)
    throw error
  }
}

/**
 * Formats a music file name according to the standardized convention
 * [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME+(LASTNAME INITIAL)]
 */
export async function formatFileName(
  competitionId: string,
  gradeId: string,
  userId: string,
  originalName: string
): Promise<string> {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID

    if (!dbId) {
      throw new Error('Missing database configuration')
    }

    // Get competition details
    const competition = await databases.getDocument(
      dbId,
      process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
      competitionId
    )

    // Get grade details
    const grade = await databases.getDocument(
      dbId,
      process.env.APPWRITE_GRADES_COLLECTION_ID!,
      gradeId
    )

    // Get user details
    const user = await users.get(userId)

    // Extract required information
    const year = competition.year
    const competitionName = competition.name.replace(/\s+/g, '-')
    const category = grade.category
    const segment = grade.segment

    // Format user name (first name + last initial)
    const nameParts = user.name.split(' ')
    const firstName = nameParts[0]
    const lastInitial =
      nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : ''
    const formattedName = `${firstName}${lastInitial ? `+${lastInitial}` : ''}`

    // Get file extension
    const extension = originalName.split('.').pop()

    return `${year}-${competitionName}-${category}-${segment}-${formattedName}.${extension}`
  } catch (error) {
    console.error('Error formatting file name:', error)
    throw error
  }
}

/**
 * Generates the download URL for a file
 * Note: This function should not be used directly for downloads.
 * Instead, use the getMusicFileDownloadUrl server action.
 */
export function getFileDownloadUrl(fileId: string): string {
  // Construct the URL manually based on the Appwrite API documentation
  const endpoint = process.env.APPWRITE_ENDPOINT!
  const bucketId = process.env.APPWRITE_BUCKET_ID!
  const projectId = process.env.APPWRITE_PROJECT_ID!

  // Remove any trailing slash from the endpoint
  const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

  return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`
}

/**
 * Validates if a file type is acceptable for music uploads
 */
export function isValidMusicFileType(mimeType: string): boolean {
  const validTypes = [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/x-wav', // WAV alternate MIME
    'audio/x-m4a', // M4A
    'audio/mp4', // M4A alternate MIME
    'audio/aac', // AAC
    'audio/x-aac', // AAC alternate MIME
  ]

  return validTypes.includes(mimeType)
}

/**
 * Checks if the current user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await users.get(userId)
    return user.labels.includes('admin')
  } catch (error) {
    console.error(`Error checking admin status for user ${userId}:`, error)
    return false
  }
}

/**
 * Middleware function to verify admin access
 */
export async function verifyAdminAccess(userId: string) {
  const isAdmin = await isUserAdmin(userId)

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return isAdmin
}
