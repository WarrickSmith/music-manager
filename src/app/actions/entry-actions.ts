'use server'

import { revalidatePath } from 'next/cache'
import { tablesDB, users, ID, Query } from '@/lib/appwrite/server'
import {
  getRowsByIds,
  isMissingTableError,
  listAllRows,
} from '@/lib/appwrite/rows'
import { ActionResult, errorMessage, fail, ok } from '@/lib/action-result'
import {
  ADMIN_ONLY_MESSAGE,
  getAdminUser,
  getSessionUser,
  isAdminUser,
} from '@/lib/auth/guards'
import { toPlainObject } from '@/lib/utils'
import type { Entry, FileInfo, GradeInfo } from '@/lib/music/entries'

const databaseId = () => process.env.APPWRITE_DATABASE_ID!
const entriesTable = () =>
  process.env.APPWRITE_ENTRIES_COLLECTION_ID || 'entries'
const gradesTable = () => process.env.APPWRITE_GRADES_COLLECTION_ID!
const musicFilesTable = () => process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!
const competitionsTable = () => process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!

const NOT_SET_UP =
  'Entries are not set up yet. Open the Setup tab and run setup, then try again.'

function explain(error: unknown, doing: string): string {
  return isMissingTableError(error)
    ? NOT_SET_UP
    : `Could not ${doing}: ${errorMessage(error)}`
}

export interface EntryOverview {
  entries: Entry[]
  grades: GradeInfo[]
  files: FileInfo[]
}

/**
 * Everything the admin Entries screen needs for one competition: who is
 * entered in which grade, the grades themselves, and the music uploaded so far.
 */
export async function getEntryOverview(
  competitionId: string,
): Promise<ActionResult<EntryOverview>> {
  if (!(await getAdminUser())) return fail(ADMIN_ONLY_MESSAGE)
  try {
    const [entries, grades, files] = await Promise.all([
      listAllRows(entriesTable(), [
        Query.equal('competitionId', competitionId),
      ]),
      listAllRows(gradesTable(), [Query.equal('competitionId', competitionId)]),
      listAllRows(musicFilesTable(), [
        Query.equal('competitionId', competitionId),
      ]),
    ])
    return ok(
      toPlainObject({
        entries: entries.map((r) => ({
          $id: r.$id,
          competitionId: r.competitionId,
          gradeId: r.gradeId,
          userId: r.userId,
          userName: r.userName,
        })),
        grades: grades.map((r) => ({
          $id: r.$id,
          name: r.name,
          category: r.category,
          segment: r.segment,
        })),
        files: files.map((r) => ({
          $id: r.$id,
          userId: r.userId,
          gradeId: r.gradeId,
          uploadedAt: r.uploadedAt,
          duration: r.duration ?? null,
        })),
      }),
    )
  } catch (error) {
    console.error('Error loading entries:', error)
    return fail(explain(error, 'load the entries'))
  }
}

/** Enter one skater in several grades. Grades they are already entered in are skipped. */
export async function addEntries(input: {
  competitionId: string
  userId: string
  userName: string
  gradeIds: string[]
}): Promise<ActionResult<{ added: number; skipped: number }>> {
  if (!(await getAdminUser())) return fail(ADMIN_ONLY_MESSAGE)
  if (!input.userId || input.gradeIds.length === 0) {
    return fail('Choose a skater and at least one grade.')
  }

  let added = 0
  let skipped = 0
  try {
    for (const gradeId of new Set(input.gradeIds)) {
      try {
        await tablesDB.createRow({
          databaseId: databaseId(),
          tableId: entriesTable(),
          rowId: ID.unique(),
          data: {
            competitionId: input.competitionId,
            gradeId,
            userId: input.userId,
            userName: input.userName,
          },
        })
        added++
      } catch (error) {
        // The unique index rejects a second entry for the same skater and grade
        if ((error as { code?: number }).code === 409) skipped++
        else throw error
      }
    }
    revalidatePath('/admin/dashboard')
    return ok({ added, skipped })
  } catch (error) {
    console.error('Error adding entries:', error)
    const prefix =
      added > 0 ? `${added} entries were added before it stopped. ` : ''
    return fail(prefix + explain(error, 'add the entries'))
  }
}

export async function removeEntry(entryId: string): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(ADMIN_ONLY_MESSAGE)
  try {
    await tablesDB.deleteRow({
      databaseId: databaseId(),
      tableId: entriesTable(),
      rowId: entryId,
    })
    revalidatePath('/admin/dashboard')
    return ok()
  } catch (error) {
    console.error('Error removing entry:', error)
    return fail(explain(error, 'remove the entry'))
  }
}

export interface OutstandingMusic {
  entryId: string
  competitionId: string
  competitionName: string
  competitionYear: number
  uploadDeadline: string | null
  gradeType: string
  gradeCategory: string
  gradeSegment: string
}

/**
 * The programmes a skater is entered in (in active competitions) that have no
 * music yet. A missing entries table is not an error here: the panel simply
 * does not appear until an admin has run setup.
 */
export async function getOutstandingMusic(
  userId: string,
): Promise<ActionResult<OutstandingMusic[]>> {
  const user = await getSessionUser()
  if (!user || (user.$id !== userId && !isAdminUser(user))) {
    return fail('You can only see your own entries.')
  }
  try {
    const entries = await listAllRows(entriesTable(), [
      Query.equal('userId', userId),
    ])
    if (entries.length === 0) return ok([])

    const [grades, competitions, files] = await Promise.all([
      getRowsByIds(
        gradesTable(),
        entries.map((e) => e.gradeId),
      ),
      getRowsByIds(
        competitionsTable(),
        entries.map((e) => e.competitionId),
      ),
      listAllRows(musicFilesTable(), [Query.equal('userId', userId)]),
    ])
    const gradeById = new Map(grades.map((g) => [g.$id, g]))
    const competitionById = new Map(competitions.map((c) => [c.$id, c]))
    const haveMusic = new Set(files.map((f) => f.gradeId))

    const outstanding: OutstandingMusic[] = []
    for (const entry of entries) {
      const grade = gradeById.get(entry.gradeId)
      const competition = competitionById.get(entry.competitionId)
      if (!grade || !competition || competition.active === false) continue
      if (haveMusic.has(entry.gradeId)) continue
      outstanding.push({
        entryId: entry.$id,
        competitionId: competition.$id,
        competitionName: competition.name,
        competitionYear: competition.year,
        uploadDeadline: competition.uploadDeadline ?? null,
        gradeType: grade.name,
        gradeCategory: grade.category,
        gradeSegment: grade.segment,
      })
    }
    return ok(toPlainObject(outstanding))
  } catch (error) {
    if (isMissingTableError(error)) return ok([])
    console.error('Error loading outstanding music:', error)
    return fail(`Could not load your entries: ${errorMessage(error)}`)
  }
}

export interface CompetitorOption {
  id: string
  name: string
  email: string
}

/** Every account that is not an admin, for choosing who to enter in a grade */
export async function listCompetitors(): Promise<
  ActionResult<CompetitorOption[]>
> {
  if (!(await getAdminUser())) return fail(ADMIN_ONLY_MESSAGE)
  try {
    const found: CompetitorOption[] = []
    let offset = 0
    while (true) {
      const page = await users.list([Query.limit(100), Query.offset(offset)])
      for (const user of page.users) {
        if (user.labels?.includes('admin')) continue
        found.push({
          id: user.$id,
          name: user.name || user.email,
          email: user.email,
        })
      }
      if (page.users.length < 100) break
      offset += 100
    }
    found.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    )
    return ok(found)
  } catch (error) {
    console.error('Error listing competitors:', error)
    return fail(`Could not load the competitors: ${errorMessage(error)}`)
  }
}
