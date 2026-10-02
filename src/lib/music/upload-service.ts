import { tablesDB, storage, ID } from '@/lib/appwrite/server'
import * as musicMetadata from 'music-metadata'
import { toPlainObject } from '@/lib/utils'
import { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES } from '@/lib/music/constants'

export { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES }

/** Thrown for problems the user can fix, such as a wrong file type */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

async function readDuration(file: File): Promise<number | null> {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer())
    let metadata
    try {
      metadata = await musicMetadata.parseBuffer(buffer, file.type)
    } catch {
      metadata = await musicMetadata.parseBuffer(buffer)
    }
    return metadata.format.duration
      ? Math.round(metadata.format.duration)
      : null
  } catch (error) {
    // A missing duration is not fatal; the file can still be stored
    console.error('Could not read audio duration:', error)
    return null
  }
}

/**
 * Store an uploaded music file and create its database record.
 * Shared by the upload route (which reports real byte progress) and the
 * uploadMusicFile server action.
 */
export async function storeMusicFile(formData: FormData) {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  const bucketId = process.env.APPWRITE_BUCKET_ID!
  const musicFilesTableId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

  const file = formData.get('file') as File | null
  const competitionId = formData.get('competitionId') as string | null
  const gradeId = formData.get('gradeId') as string | null
  const userId = formData.get('userId') as string | null
  const userName = (formData.get('userName') as string | null)?.trim()

  if (!file || !competitionId || !gradeId || !userId || !userName) {
    throw new UploadValidationError('Some required details are missing.')
  }
  if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
    throw new UploadValidationError(
      'Invalid file type. Only MP3, WAV, M4A or AAC audio files are accepted.',
    )
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError('File size must be less than 15MB.')
  }

  const durationFromForm = formData.get('duration')
  const duration =
    durationFromForm && !isNaN(Number(durationFromForm))
      ? Number(durationFromForm)
      : await readDuration(file)

  const competition = await tablesDB.getRow({
    databaseId,
    tableId: process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
    rowId: competitionId,
  })
  const grade = await tablesDB.getRow({
    databaseId,
    tableId: process.env.APPWRITE_GRADES_COLLECTION_ID!,
    rowId: gradeId,
  })

  // First name plus last-name initial, e.g. "Mia Kowalski" becomes "Mia-k"
  let formattedUserName = userName
  if (userName.includes(' ')) {
    const parts = userName.split(' ')
    formattedUserName = `${parts[0]}-${parts[parts.length - 1].charAt(0).toLowerCase()}`
  }

  const extension = file.name.split('.').pop()
  const formattedFileName =
    `${competition.year}-${competition.name}-${grade.category}-${grade.segment}-${formattedUserName}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase()

  const renamedFile = new File([file], `${formattedFileName}.${extension}`, {
    type: file.type,
  })
  const uploadedFile = await storage.createFile(
    bucketId,
    ID.unique(),
    renamedFile,
  )

  const row = await tablesDB.createRow({
    databaseId,
    tableId: musicFilesTableId,
    rowId: ID.unique(),
    data: {
      fileId: uploadedFile.$id,
      originalName: file.name,
      fileName: formattedFileName,
      storagePath: `${bucketId}/${uploadedFile.$id}`,
      competitionId,
      competitionName: competition.name,
      competitionYear: competition.year,
      gradeId,
      gradeType: grade.name,
      gradeCategory: grade.category,
      gradeSegment: grade.segment,
      userId,
      userName,
      uploadedAt: new Date().toISOString(),
      duration,
      size: file.size,
      status: 'ready',
    },
  })

  return toPlainObject(row)
}
