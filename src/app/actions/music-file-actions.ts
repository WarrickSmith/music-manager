'use server'

import { databases, storage, ID, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import * as musicMetadata from 'music-metadata'
import { Models } from 'node-appwrite'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-service'

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
    let allDocuments: Models.Document[] = []
    let hasMoreDocuments = true

    // Add limit to queries
    const queriesWithLimit = [Query.orderDesc('uploadedAt'), Query.limit(limit)]

    while (hasMoreDocuments) {
      // Add offset to queries
      const currentQueries = [...queriesWithLimit, Query.offset(offset)]

      const response = await databases.listDocuments(
        databaseId,
        musicFilesCollectionId,
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
  } catch (error) {
    console.error('Error fetching all music files:', error)
    throw new Error('Failed to fetch music files')
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
    // Get duration from form data if available
    const durationFromForm = formData.get('duration')
    let initialDuration: number | null = null
    if (durationFromForm && !isNaN(Number(durationFromForm))) {
      initialDuration = Number(durationFromForm)
      console.log('Using duration from form data:', initialDuration)
    }

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

    console.log('Starting metadata extraction for file:', file.name)
    console.log('File type:', file.type)
    console.log('File size:', file.size)

    // Use the duration from form data if available, otherwise try to extract it
    let duration: number | null = initialDuration

    // Only try to extract duration if it wasn't provided in the form data
    if (duration === null) {
      try {
        console.log('No duration from form data, extracting from file...')
        // Convert the File to ArrayBuffer for music-metadata parsing
        const buffer = await file.arrayBuffer()
        console.log(
          'Successfully converted file to ArrayBuffer:',
          buffer.byteLength,
          'bytes'
        )

        // Use a different parsing approach based on file type
        let metadata
        try {
          console.log('Attempting to parse audio metadata...')
          metadata = await musicMetadata.parseBuffer(
            new Uint8Array(buffer),
            file.type
          )
          console.log(
            'Metadata parsing successful:',
            JSON.stringify(metadata.format, null, 2)
          )
        } catch (parseError) {
          console.error(
            'Error during parseBuffer, trying alternate approach:',
            parseError
          )
          // Try without specifying content type as fallback
          metadata = await musicMetadata.parseBuffer(new Uint8Array(buffer))
          console.log('Fallback metadata parsing successful')
        }

        // Get duration in seconds and round to nearest second
        if (metadata && metadata.format && metadata.format.duration) {
          duration = Math.round(metadata.format.duration)
          console.log(`Extracted audio duration: ${duration} seconds`)
        } else {
          console.log('Could not extract duration from metadata:', metadata)
        }
      } catch (metadataError) {
        console.error('Error extracting audio metadata:', metadataError)
        console.error(
          'Stack trace:',
          metadataError instanceof Error
            ? metadataError.stack
            : 'No stack trace'
        )
        // We'll continue without the duration if extraction fails
      }
    } else {
      console.log(`Using provided duration: ${duration} seconds`)
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

    // Format the user name to get first name and last name initial
    const fullName = (formData.get('userName') as string).trim()
    let formattedUserName = fullName

    // Process the name to extract first name and last name initial
    if (fullName.includes(' ')) {
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts[nameParts.length - 1]
      const lastNameInitial = lastName.charAt(0).toLowerCase()
      formattedUserName = `${firstName}-${lastNameInitial}`
    }

    // Generate standardized file name with extension
    const fileExtension = file.name.split('.').pop()
    const formattedFileName =
      `${competition.year}-${competition.name}-${grade.category}-${grade.segment}-${formattedUserName}`
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
        // Don't store downloadURL in the database as it may expire
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
        duration: duration, // Add the extracted duration to the metadata
        size: file.size,
        status: 'ready',
      }
    )

    console.log('Music file document created with duration:', duration)

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
 * Get file download URL with proper authentication and correct file extension
 */
export async function getMusicFileDownloadUrl(fileId: string) {
  try {
    console.log('Getting download URL for file:', fileId)
    console.log('Bucket ID:', bucketId)

    // First, verify the file exists using the server API key
    await storage.getFile(bucketId, fileId)

    // Find the corresponding database record to get the original file name
    const fileRecords = await databases.listDocuments(
      databaseId,
      musicFilesCollectionId,
      [Query.equal('fileId', fileId)]
    )

    let originalName = ''

    if (fileRecords.documents.length > 0) {
      // Get the file metadata from the database
      originalName = fileRecords.documents[0].originalName || ''
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
    const url = `${baseUrl}${apiPath}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}&project=${projectId}&mode=admin`

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

    // Create a properly formed URL with admin mode authentication for streaming
    // Using 'view' instead of 'download' for streaming
    const url = `${baseUrl}${apiPath}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&project=${projectId}&mode=admin`

    console.log('Generated streaming URL with server authentication:', url)

    return { url }
  } catch (error) {
    console.error('Error generating streaming URL:', error)
    throw new Error('Failed to generate streaming URL')
  }
}
