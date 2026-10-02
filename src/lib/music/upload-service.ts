import { tablesDB, storage, ID, Query } from '@/lib/appwrite/server'
import * as musicMetadata from 'music-metadata'
import { toPlainObject } from '@/lib/utils'
import { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES } from '@/lib/music/constants'
import { formatDeadlineDate, isPastDeadline } from '@/lib/deadline'

export { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES }

/** Thrown for problems the user can fix, such as a wrong file type */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

/** Thrown when a competitor tries to upload after the competition's deadline */
export class UploadDeadlineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadDeadlineError'
  }
}

/** What the skater already has uploaded for a grade */
export interface ExistingMusicSummary {
  id: string
  originalName: string
  uploadedAt: string
  size: number
  duration: number | null
}

/**
 * Thrown when the skater already has a file for this grade and the upload did
 * not say it should replace it.
 */
export class UploadConflictError extends Error {
  constructor(public existing: ExistingMusicSummary) {
    super(
      `You already have a file for this programme (${existing.originalName}). Confirm that you want to replace it.`
    )
    this.name = 'UploadConflictError'
  }
}

export interface UploadActor {
  /** Admins can upload and replace after a deadline; competitors cannot */
  isAdmin: boolean
}

const MUSIC_FILES_TABLE = () => process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

/** Music files this skater already has for a grade, newest first */
export async function findMusicFilesForGrade(userId: string, gradeId: string) {
  const response = await tablesDB.listRows({
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    tableId: MUSIC_FILES_TABLE(),
    queries: [
      Query.equal('userId', userId),
      Query.equal('gradeId', gradeId),
      Query.orderDesc('uploadedAt'),
      Query.limit(10),
    ],
  })
  return response.rows
}

export function summariseExisting(row: {
  $id: string
  originalName?: string
  uploadedAt?: string
  size?: number
  duration?: number | null
}): ExistingMusicSummary {
  return {
    id: row.$id,
    originalName: row.originalName ?? 'an earlier file',
    uploadedAt: row.uploadedAt ?? '',
    size: row.size ?? 0,
    duration: row.duration ?? null,
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
export async function storeMusicFile(
  formData: FormData,
  actor: UploadActor = { isAdmin: false }
) {
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

  if (!actor.isAdmin && isPastDeadline(competition.uploadDeadline)) {
    throw new UploadDeadlineError(
      `Uploads for ${competition.name} closed on ${formatDeadlineDate(new Date(competition.uploadDeadline))}. Ask a club admin if you need to change your music.`
    )
  }

  // One file per skater per grade: a second upload must be a deliberate replace
  const replace = formData.get('replace') === 'true'
  const existing = await findMusicFilesForGrade(userId, gradeId)
  if (existing.length > 0 && !replace) {
    throw new UploadConflictError(summariseExisting(existing[0]))
  }

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

  // Remove the earlier file only now that the new one is safely stored, so a
  // failed upload never leaves the skater with no music at all
  for (const old of existing) {
    try {
      await storage.deleteFile(bucketId, old.fileId)
    } catch (error) {
      console.error('Could not delete the replaced file from storage:', error)
    }
    try {
      await tablesDB.deleteRow({
        databaseId,
        tableId: musicFilesTableId,
        rowId: old.$id,
      })
    } catch (error) {
      console.error('Could not delete the replaced file record:', error)
    }
  }

  return toPlainObject(row)
}
