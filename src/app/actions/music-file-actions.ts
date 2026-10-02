'use server'

import { tablesDB, storage, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { Models } from 'node-appwrite'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-service'
import { toPlainObject } from '@/lib/utils'
import {
  findMusicFilesForGrade,
  storeMusicFile,
  summariseExisting,
  type ExistingMusicSummary,
} from '@/lib/music/upload-service'
import { ActionResult, errorMessage, fail, ok } from '@/lib/action-result'
import { getSessionUser, isAdminUser } from '@/lib/auth/guards'
import { formatDeadlineDate, isPastDeadline } from '@/lib/deadline'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

/**
 * Get all music files for a specific user
 */
export async function getUserMusicFiles(userId: string) {
  try {
    // Check if Appwrite is initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const response = await tablesDB.listRows({
      databaseId,
      tableId: musicFilesCollectionId,
      queries: [
        Query.equal('userId', userId),
        Query.orderDesc('uploadedAt'),
        Query.limit(100),
      ],
    })
    return toPlainObject(response.rows)
  } catch (error) {
    console.error('Error fetching user music files:', error)
    throw new Error('Failed to fetch your music files')
  }
}

/**
 * Get all music files (for admin use)
 */
export async function getAllMusicFiles() {
  try {
    // Check if Appwrite is initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    // Fetch all music files with pagination handling
    const limit = 100 // Maximum allowed by Appwrite
    let offset = 0
    let allDocuments: Models.DefaultRow[] = []
    let hasMoreDocuments = true

    // Add limit to queries
    const queriesWithLimit = [Query.orderDesc('uploadedAt'), Query.limit(limit)]

    while (hasMoreDocuments) {
      // Add offset to queries
      const currentQueries = [...queriesWithLimit, Query.offset(offset)]

      const response = await tablesDB.listRows({
        databaseId,
        tableId: musicFilesCollectionId,
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

    return toPlainObject(allDocuments)
  } catch (error) {
    console.error('Error fetching all music files:', error)
    throw new Error('Failed to fetch music files')
  }
}

/**
 * Upload a new music file. The upload form posts to /api/music/upload so it
 * can show byte-level progress; this action remains for server-side callers.
 */
export async function uploadMusicFile(formData: FormData) {
  try {
    const actor = { isAdmin: isAdminUser(await getSessionUser()) }
    const musicFile = await storeMusicFile(formData, actor)
    revalidatePath('/dashboard')
    return { success: true, musicFile }
  } catch (error) {
    console.error('Error uploading music file:', error)
    throw new Error(
      `Failed to upload music file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * The skater's current file for a grade, if any. The upload form uses this to
 * warn that uploading will replace it.
 */
export async function findExistingMusicFile(
  userId: string,
  gradeId: string
): Promise<ActionResult<ExistingMusicSummary | null>> {
  try {
    const rows = await findMusicFilesForGrade(userId, gradeId)
    return ok(rows.length > 0 ? summariseExisting(rows[0]) : null)
  } catch (error) {
    console.error('Error looking for an existing music file:', error)
    return fail(
      `Could not check for an existing file: ${errorMessage(error)}`
    )
  }
}

/**
 * Delete a music file. Competitors cannot delete once the competition's upload
 * deadline has passed; admins always can. Returns the reason instead of
 * throwing for that rule so it reaches the screen in production.
 */
export async function deleteMusicFile(
  fileId: string,
  musicFileId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getSessionUser()
    if (!isAdminUser(user)) {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: musicFilesCollectionId,
        rowId: musicFileId,
      })
      const competition = await tablesDB
        .getRow({
          databaseId,
          tableId: process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
          rowId: row.competitionId,
        })
        .catch(() => null)
      if (competition && isPastDeadline(competition.uploadDeadline)) {
        return {
          success: false,
          error: `Uploads for ${competition.name} closed on ${formatDeadlineDate(new Date(competition.uploadDeadline))}, so this file is locked. Ask a club admin to remove it.`,
        }
      }
    }

    // Delete file from storage
    await storage.deleteFile(bucketId, fileId)

    // Delete document from MusicFiles collection
    await tablesDB.deleteRow({
      databaseId,
      tableId: musicFilesCollectionId,
      rowId: musicFileId,
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting music file:', error)
    throw new Error('Failed to delete music file')
  }
}

/**
 * Get file download URL with proper authentication and correct file extension
 */
export async function getMusicFileDownloadUrl(fileId: string) {
  try {
    console.log('Getting download URL for file:', fileId)
    console.log('Bucket ID:', bucketId)

    // First, verify the file exists using the server API key
    await storage.getFile(bucketId, fileId)

    // Find the corresponding database record to get the original file name
    const fileRecords = await tablesDB.listRows({
      databaseId,
      tableId: musicFilesCollectionId,
      queries: [Query.equal('fileId', fileId)],
    })

    let originalName = ''

    if (fileRecords.rows.length > 0) {
      // Get the file metadata from the database
      originalName = fileRecords.rows[0].originalName || ''
      console.log('Found file record with name:', originalName)
    } else {
      console.log('No file record found in database, using default file name')
    }

    // Generate the download URL with the format from the working admin link
    const endpoint = process.env.APPWRITE_ENDPOINT!
    const projectId = process.env.APPWRITE_PROJECT_ID!

    // Remove any trailing slash from the endpoint
    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

    // Check if the endpoint already includes the /v1 path and avoid duplicating it
    const apiPath = baseUrl.endsWith('/v1') ? '' : '/v1'

    // Create a properly formed URL with admin mode authentication
    // Fix: Remove duplicate project parameter for consistency
    const url = `${baseUrl}${apiPath}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}&mode=admin`

    console.log('Generated download URL with server authentication:', url)

    return { url }
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

/**
 * Get file view URL for streaming audio with proper authentication
 */
export async function getMusicFileViewUrl(fileId: string) {
  try {
    console.log('Getting streaming URL for file:', fileId)
    console.log('Bucket ID:', bucketId)

    // First, verify the file exists using the server API key
    await storage.getFile(bucketId, fileId)

    // Generate the view URL for streaming
    const endpoint = process.env.APPWRITE_ENDPOINT!
    const projectId = process.env.APPWRITE_PROJECT_ID!

    // Remove any trailing slash from the endpoint
    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

    // Check if the endpoint already includes the /v1 path and avoid duplicating it
    const apiPath = baseUrl.endsWith('/v1') ? '' : '/v1'

    // Add cache busting parameter to prevent caching issues with audio streaming
    const cacheBuster = new Date().getTime()

    // Create a public URL with no authentication required for streaming
    // Since we updated bucket permissions to allow public reads, we don't need admin mode
    const url = `${baseUrl}${apiPath}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&cache=${cacheBuster}&disposition=inline`

    console.log('Generated streaming URL for public access:', url)

    return { url }
  } catch (error) {
    console.error('Error generating streaming URL:', error)
    throw new Error('Failed to generate streaming URL')
  }
}
