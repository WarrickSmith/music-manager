import { tablesDB, storage, ID, Query } from '@/lib/appwrite/server'
import { toPlainObject } from '@/lib/utils'
import { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES } from '@/lib/music/constants'
import { formatDeadlineDate, isPastDeadline } from '@/lib/deadline'
import { NotAudioError, sniffAudio } from '@/lib/music/audio-sniff'

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

/**
 * Who is uploading. The identity always comes from the signed-in session, never
 * from the form, so a competitor cannot upload as someone else.
 */
export interface UploadActor {
  id: string
  /** The name stored on the file and used in its file name */
  name: string
  /** Admins can upload after a deadline, to any competition, and for another skater */
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

/** The name the skater's file had, with path and control characters removed */
function cleanOriginalName(name: string): string {
  return (
    name
      .replace(/[\u0000-\u001f\u007f/\\]/g, '')
      .trim()
      .slice(0, 255) || 'audio'
  )
}

/**
 * Store an uploaded music file and create its database record.
 * Called by the upload route, which reports real byte progress.
 */
export async function storeMusicFile(formData: FormData, actor: UploadActor) {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  const bucketId = process.env.APPWRITE_BUCKET_ID!
  const musicFilesTableId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

  const file = formData.get('file')
  const competitionId = formData.get('competitionId')
  const gradeId = formData.get('gradeId')
  if (
    !(file instanceof File) ||
    typeof competitionId !== 'string' ||
    typeof gradeId !== 'string' ||
    !competitionId ||
    !gradeId
  ) {
    throw new UploadValidationError('Some required details are missing.')
  }

  // Whose music this is: the signed-in user. Only an admin may upload for
  // another skater, by naming them in the form.
  let userId = actor.id
  let userName = actor.name.trim() || 'Skater'
  if (actor.isAdmin) {
    const onBehalfId = formData.get('userId')
    const onBehalfName = formData.get('userName')
    if (typeof onBehalfId === 'string' && onBehalfId) {
      userId = onBehalfId
      userName =
        (typeof onBehalfName === 'string' && onBehalfName.trim()) || userName
    }
  }

  if (file.size === 0) {
    throw new UploadValidationError('This file is empty.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError('File size must be less than 15MB.')
  }

  // Check what the file really is from its bytes. The name and the type the
  // browser reported are not trusted, and the length comes from the file.
  const bytes = new Uint8Array(await file.arrayBuffer())
  let audio
  try {
    audio = await sniffAudio(bytes)
  } catch (error) {
    if (error instanceof NotAudioError) {
      throw new UploadValidationError(error.message)
    }
    throw error
  }

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

  if (grade.competitionId !== competitionId) {
    throw new UploadValidationError(
      'That grade does not belong to the chosen competition.'
    )
  }
  if (!actor.isAdmin && competition.active === false) {
    throw new UploadValidationError(
      `${competition.name} is not open for uploads.`
    )
  }

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

  // Standardised name. The extension comes from the content, not the original name.
  const formattedFileName =
    `${competition.year}-${competition.name}-${grade.category}-${grade.segment}-${formattedUserName}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase()
      .slice(0, 200)

  const renamedFile = new File(
    [bytes],
    `${formattedFileName}.${audio.extension}`,
    { type: audio.mimeType }
  )
  const uploadedFile = await storage.createFile(
    bucketId,
    ID.unique(),
    renamedFile
  )

  const row = await tablesDB.createRow({
    databaseId,
    tableId: musicFilesTableId,
    rowId: ID.unique(),
    data: {
      fileId: uploadedFile.$id,
      originalName: cleanOriginalName(file.name),
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
      duration: audio.durationSeconds,
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
