'use server'

import { tablesDB, storage, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-core'
import { listAllRows } from '@/lib/appwrite/rows'
import { toPlainObject } from '@/lib/utils'
import {
  findMusicFilesForGrade,
  summariseExisting,
  type ExistingMusicSummary,
} from '@/lib/music/upload-service'
import { ActionResult, errorMessage, fail, ok } from '@/lib/action-result'
import {
  FORBIDDEN_MESSAGE,
  isAdminUser,
  requireAdmin,
  requireSelfOrAdmin,
  requireUser,
} from '@/lib/auth/guards'
import { formatDeadlineDate, isPastDeadline } from '@/lib/deadline'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

/**
 * Music files for one skater. A skater can only ask for their own; admins can
 * ask for anyone's.
 */
export async function getUserMusicFiles(userId: string) {
  await requireSelfOrAdmin(userId)
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

/** Every music file (admins only) */
export async function getAllMusicFiles() {
  await requireAdmin()
  try {
    // Check if Appwrite is initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    return toPlainObject(
      await listAllRows(musicFilesCollectionId, [Query.orderDesc('uploadedAt')])
    )
  } catch (error) {
    console.error('Error fetching all music files:', error)
    throw new Error('Failed to fetch music files')
  }
}

/**
 * The signed-in skater's current file for a grade, if any. The upload form
 * uses this to warn that uploading will replace it. Uploading itself goes
 * through POST /api/music/upload so it can show byte-level progress.
 */
export async function findExistingMusicFile(
  gradeId: string
): Promise<ActionResult<ExistingMusicSummary | null>> {
  const user = await requireUser()
  try {
    const rows = await findMusicFilesForGrade(user.$id, gradeId)
    return ok(rows.length > 0 ? summariseExisting(rows[0]) : null)
  } catch (error) {
    console.error('Error looking for an existing music file:', error)
    return fail(`Could not check for an existing file: ${errorMessage(error)}`)
  }
}

/**
 * Delete a music file. A skater can delete their own files and an admin can
 * delete any. Competitors cannot delete once the competition's upload deadline
 * has passed; admins always can.
 *
 * The caller names only the record. The stored file to remove is read from
 * that record, so a caller cannot point this at some other file in storage.
 * Business-rule refusals are returned rather than thrown so the reason
 * reaches the screen in production.
 */
export async function deleteMusicFile(
  musicFileId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser()
  const admin = isAdminUser(user)

  let row
  try {
    row = await tablesDB.getRow({
      databaseId,
      tableId: musicFilesCollectionId,
      rowId: musicFileId,
    })
  } catch (error) {
    console.error('Error finding the music file to delete:', error)
    return { success: false, error: 'That music file could not be found.' }
  }

  if (row.userId !== user.$id && !admin) {
    return { success: false, error: FORBIDDEN_MESSAGE }
  }

  try {
    if (!admin) {
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

    // Delete file from storage, then the record
    await storage.deleteFile(bucketId, row.fileId)
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
