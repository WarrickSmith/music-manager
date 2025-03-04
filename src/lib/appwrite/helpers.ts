import { databases, storage, users, ID, Query } from './server'
import { Models } from 'node-appwrite'

/**
 * Helper functions for working with music files
 */

/**
 * Uploads a music file to Appwrite storage and creates a document in the database
 */
export async function uploadMusicFile(
  file: File,
  competitionId: string,
  gradeId: string,
  userId: string
): Promise<Models.Document> {
  try {
    // Validate inputs
    if (!file || !competitionId || !gradeId || !userId) {
      throw new Error('Missing required fields')
    }

    // Get competition and grade details for the file metadata
    const dbId = process.env.APPWRITE_DATABASE_ID!
    const competition = await databases.getDocument(
      dbId,
      process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
      competitionId
    )

    const grade = await databases.getDocument(
      dbId,
      process.env.APPWRITE_GRADES_COLLECTION_ID!,
      gradeId
    )

    const user = await users.get(userId)

    // Format file name according to convention
    const fileName = await formatFileName(
      competitionId,
      gradeId,
      userId,
      file.name
    )

    // Upload file to storage
    const bucketId = process.env.APPWRITE_BUCKET_ID!
    const fileId = ID.unique()

    const uploadedFile = await storage.createFile(bucketId, fileId, file)

    // Create document in database
    const collectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

    const fileDoc = await databases.createDocument(
      dbId,
      collectionId,
      ID.unique(),
      {
        originalName: file.name,
        fileName,
        storagePath: uploadedFile.$id,
        downloadURL: getFileDownloadUrl(uploadedFile.$id),
        competitionId,
        competitionName: competition.name,
        competitionYear: competition.year,
        gradeId,
        gradeType: grade.name,
        gradeCategory: grade.category,
        gradeSegment: grade.segment,
        userId,
        userName: user.name,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: 'active',
        fileId: uploadedFile.$id,
      }
    )

    return fileDoc
  } catch (error) {
    console.error('Error uploading music file:', error)
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
    const dbId = process.env.APPWRITE_DATABASE_ID!

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
 */
export function getFileDownloadUrl(fileId: string): string {
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/download`
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
 * Helper functions for working with competitions
 */

/**
 * Creates a new competition
 */
export async function createCompetition(
  name: string,
  year: number,
  description?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Models.Document> {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID!
    const collectionId = process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!

    const competition = await databases.createDocument(
      dbId,
      collectionId,
      ID.unique(),
      {
        name,
        year,
        active: true,
        description: description || '',
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      }
    )

    return competition
  } catch (error) {
    console.error('Error creating competition:', error)
    throw error
  }
}

/**
 * Adds grades to a competition from the template
 */
export async function addGradesToCompetition(
  competitionId: string
): Promise<Models.DocumentList<Models.Document>> {
  try {
    const dbId = process.env.APPWRITE_DATABASE_ID!
    const gradesCollectionId = process.env.APPWRITE_GRADES_COLLECTION_ID!

    // Get template grades
    const templateGrades = await databases.listDocuments(
      dbId,
      gradesCollectionId,
      [Query.equal('isTemplate', true)]
    )

    // Create grades for the competition
    const createdGrades = []

    for (const template of templateGrades.documents) {
      const grade = await databases.createDocument(
        dbId,
        gradesCollectionId,
        ID.unique(),
        {
          name: template.name,
          category: template.category,
          segment: template.segment,
          competitionId,
          isTemplate: false,
          description:
            template.description ||
            `${template.name} ${template.category} ${template.segment}`,
        }
      )

      createdGrades.push(grade)
    }

    return {
      total: createdGrades.length,
      documents: createdGrades,
    } as Models.DocumentList<Models.Document>
  } catch (error) {
    console.error(`Error adding grades to competition ${competitionId}:`, error)
    throw error
  }
}

/**
 * Helper functions for working with users
 */

/**
 * Updates a user's role
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'competitor'
): Promise<void> {
  try {
    await users.updateLabels(userId, [role])
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error)
    throw error
  }
}

/**
 * Toggles a user's status between active and blocked
 */
export async function toggleUserStatus(
  userId: string,
  active: boolean
): Promise<void> {
  try {
    // Pass the boolean value directly to updateStatus
    await users.updateStatus(userId, active)
  } catch (error) {
    console.error(`Error toggling status for user ${userId}:`, error)
    throw error
  }
}
