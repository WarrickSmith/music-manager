'use server'

import { databases, storage, ID, Query } from '@/lib/appwrite/server'
import { getFileDownloadUrl } from '@/lib/appwrite/helpers'
import { revalidatePath } from 'next/cache'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

/**
 * Get all music files for a specific user
 */
export async function getUserMusicFiles(userId: string) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      musicFilesCollectionId,
      [Query.equal('userId', userId), Query.orderDesc('uploadedAt')]
    )
    return response.documents
  } catch (error) {
    console.error('Error fetching user music files:', error)
    throw new Error('Failed to fetch your music files')
  }
}

/**
 * Upload a new music file
 */
export async function uploadMusicFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const competitionId = formData.get('competitionId') as string
    const gradeId = formData.get('gradeId') as string
    const userId = formData.get('userId') as string

    if (!file || !competitionId || !gradeId || !userId) {
      throw new Error('Missing required information')
    }

    // Validate file type
    const validTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/x-aac',
    ]
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only audio files are accepted.')
    }

    // Get competition and grade details for denormalization
    const competition = await databases.getDocument(
      databaseId,
      process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
      competitionId
    )

    const grade = await databases.getDocument(
      databaseId,
      process.env.APPWRITE_GRADES_COLLECTION_ID!,
      gradeId
    )

    // Generate standardized file name with extension
    const fileExtension = file.name.split('.').pop()
    const formattedFileName = `${competition.year}-${competition.name}-${
      grade.category
    }-${grade.segment}-${formData.get('userName')}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase()
    const fullFileName = `${formattedFileName}.${fileExtension}`

    // Create a new File object with the formatted name
    const renamedFile = new File([file], fullFileName, { type: file.type })

    // Upload file to storage
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      renamedFile
    )

    // Create document in MusicFiles collection
    const musicFileDocument = await databases.createDocument(
      databaseId,
      musicFilesCollectionId,
      ID.unique(),
      {
        fileId: uploadedFile.$id,
        originalName: file.name,
        fileName: formattedFileName,
        storagePath: `${bucketId}/${uploadedFile.$id}`,
        downloadURL: getFileDownloadUrl(uploadedFile.$id),
        competitionId,
        competitionName: competition.name,
        competitionYear: competition.year,
        gradeId,
        gradeType: grade.name,
        gradeCategory: grade.category,
        gradeSegment: grade.segment,
        userId,
        userName: formData.get('userName') as string,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: 'ready',
      }
    )

    revalidatePath('/dashboard')
    return { success: true, musicFile: musicFileDocument }
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
 * Delete a music file
 */
export async function deleteMusicFile(fileId: string, musicFileId: string) {
  try {
    // Delete file from storage
    await storage.deleteFile(bucketId, fileId)

    // Delete document from MusicFiles collection
    await databases.deleteDocument(
      databaseId,
      musicFilesCollectionId,
      musicFileId
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting music file:', error)
    throw new Error('Failed to delete music file')
  }
}

/**
 * Get file download URL
 */
export async function getMusicFileDownloadUrl(fileId: string) {
  try {
    return { url: getFileDownloadUrl(fileId) }
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw new Error('Failed to generate download URL')
  }
}
