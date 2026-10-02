'use server'

import { tablesDB, ID, Query } from '@/lib/appwrite/server'
import { Models } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { defaultGrades } from '@/lib/appwrite/default-grades'
import { storage } from '@/lib/appwrite/server'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-service'
import { toPlainObject } from '@/lib/utils'
import { ActionResult, errorMessage, fail, ok } from '@/lib/action-result'
import { ADMIN_ONLY_MESSAGE, getAdminUser } from '@/lib/auth/guards'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const competitionsCollectionId =
  process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!
const gradesCollectionId = process.env.APPWRITE_GRADES_COLLECTION_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!

/**
 * Utility function to fetch all documents with pagination
 * @param databaseId Database ID
 * @param collectionId Collection ID
 * @param queries Query parameters
 * @returns Array of all documents from all pages
 */
async function getAllDocuments(
  databaseId: string,
  collectionId: string,
  queries: string[] = []
) {
  const limit = 100 // Maximum allowed by Appwrite
  let offset = 0
  let allDocuments: Models.DefaultRow[] = []
  let hasMoreDocuments = true

  // Add limit to queries if not already specified
  const queriesWithLimit = [...queries, Query.limit(limit)]

  while (hasMoreDocuments) {
    // Add offset to queries
    const currentQueries = [...queriesWithLimit, Query.offset(offset)]

    const response = await tablesDB.listRows({
      databaseId,
      tableId: collectionId,
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

  return allDocuments
}

export async function getCompetitions() {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const response = await tablesDB.listRows({
      databaseId,
      tableId: competitionsCollectionId,
      queries: [
        Query.orderDesc('year'),
        Query.orderAsc('name'),
        Query.limit(100),
      ],
    })

    return toPlainObject(response.rows)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    throw new Error('Failed to fetch competitions')
  }
}

export async function createCompetition({
  name,
  year,
  active,
  useDefaultGrades,
  cloneFromCompetitionId,
  uploadDeadline,
}: {
  name: string
  year: number
  active: boolean
  useDefaultGrades: boolean
  cloneFromCompetitionId?: string
  /** ISO timestamp after which competitors cannot upload; omit for none */
  uploadDeadline?: string | null
}) {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      throw new Error(
        'Appwrite resources are not initialized. Please run the initialization process first.'
      )
    }

    // Create competition document
    const competition = await tablesDB.createRow({
      databaseId,
      tableId: competitionsCollectionId,
      rowId: ID.unique(),
      // The deadline column only exists after setup has been run since deadlines
      // were added, so leave the field out entirely when there is no deadline
      data: {
        name,
        year,
        active,
        ...(uploadDeadline ? { uploadDeadline } : {}),
      },
    })

    // Create associated grades
    if (useDefaultGrades) {
      // Use default grades from template
      for (const grade of defaultGrades) {
        await tablesDB.createRow({
          databaseId,
          tableId: gradesCollectionId,
          rowId: ID.unique(),
          data: {
            name: grade.name,
            category: grade.category,
            segment: grade.segment,
            competitionId: competition.$id,
          },
        })
      }
    } else if (cloneFromCompetitionId) {
      // Clone grades from existing competition using the pagination utility
      const existingGrades = await getAllDocuments(
        databaseId,
        gradesCollectionId,
        [Query.equal('competitionId', cloneFromCompetitionId)]
      )

      for (const grade of existingGrades) {
        await tablesDB.createRow({
          databaseId,
          tableId: gradesCollectionId,
          rowId: ID.unique(),
          data: {
            name: grade.name,
            category: grade.category,
            segment: grade.segment,
            competitionId: competition.$id,
          },
        })
      }
    }

    revalidatePath('/admin/dashboard')
    return toPlainObject(competition)
  } catch (error) {
    console.error('Error creating competition:', error)
    throw new Error('Failed to create competition')
  }
}

export async function updateCompetitionStatus(
  competitionId: string,
  active: boolean
) {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      throw new Error(
        'Appwrite resources are not initialized. Please run the initialization process first.'
      )
    }

    const result = await tablesDB.updateRow({
      databaseId,
      tableId: competitionsCollectionId,
      rowId: competitionId,
      data: { active },
    })

    revalidatePath('/admin/dashboard')
    return toPlainObject(result)
  } catch (error) {
    console.error('Error updating competition status:', error)
    throw new Error('Failed to update competition status')
  }
}

export async function deleteCompetition(competitionId: string) {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      throw new Error(
        'Appwrite resources are not initialized. Please run the initialization process first.'
      )
    }

    // Delete all associated music files using pagination
    const musicFiles = await getAllDocuments(
      databaseId,
      musicFilesCollectionId,
      [Query.equal('competitionId', competitionId)]
    )

    // Delete music files from storage and database
    for (const file of musicFiles) {
      try {
        // Delete file from storage
        await storage.deleteFile(bucketId, file.fileId)
        // Delete file record from database
        await tablesDB.deleteRow({
          databaseId,
          tableId: musicFilesCollectionId,
          rowId: file.$id,
        })
      } catch (fileError) {
        console.error(`Error deleting music file ${file.$id}:`, fileError)
        // Continue deleting other files even if one fails
      }
    }

    // Delete all associated grades using pagination
    const grades = await getAllDocuments(databaseId, gradesCollectionId, [
      Query.equal('competitionId', competitionId),
    ])

    // Delete grades
    for (const grade of grades) {
      await tablesDB.deleteRow({
        databaseId,
        tableId: gradesCollectionId,
        rowId: grade.$id,
      })
    }

    // Delete competition
    await tablesDB.deleteRow({
      databaseId,
      tableId: competitionsCollectionId,
      rowId: competitionId,
    })

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error deleting competition:', error)
    throw new Error('Failed to delete competition')
  }
}

/**
 * Get all active competitions
 */
export async function getActiveCompetitions() {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const response = await tablesDB.listRows({
      databaseId,
      tableId: competitionsCollectionId,
      queries: [
        Query.equal('active', true),
        Query.orderDesc('year'),
        Query.orderAsc('name'),
        Query.limit(100),
      ],
    })
    return toPlainObject(response.rows)
  } catch (error) {
    console.error('Error fetching active competitions:', error)
    throw new Error('Failed to fetch active competitions')
  }
}

/**
 * Get grades for a competition with optional filtering
 */
export async function getGradesForCompetition(
  competitionId: string,
  category?: string
) {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const queries = [Query.equal('competitionId', competitionId)]

    if (category) {
      queries.push(Query.equal('category', category))
    }

    // A competition has ~80 default grades, more than one page of results
    const rows = await getAllDocuments(databaseId, gradesCollectionId, queries)

    return toPlainObject(rows)
  } catch (error) {
    console.error('Error fetching grades:', error)
    throw new Error('Failed to fetch grades')
  }
}

/**
 * Get unique grade categories for a competition
 */
export async function getGradeCategoriesForCompetition(competitionId: string) {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const rows = await getAllDocuments(databaseId, gradesCollectionId, [
      Query.equal('competitionId', competitionId),
    ])

    const categories = new Set<string>()
    rows.forEach((doc) => {
      if (doc.category) {
        categories.add(doc.category)
      }
    })

    return Array.from(categories).sort()
  } catch (error) {
    console.error('Error fetching grade categories:', error)
    throw new Error('Failed to fetch grade categories')
  }
}

/**
 * Set or clear the time after which competitors can no longer upload, replace
 * or delete music for a competition. Admins are never locked out.
 */
export async function updateCompetitionDeadline(
  competitionId: string,
  uploadDeadline: string | null
): Promise<ActionResult<{ uploadDeadline: string | null }>> {
  if (!(await getAdminUser())) return fail(ADMIN_ONLY_MESSAGE)

  if (uploadDeadline && Number.isNaN(new Date(uploadDeadline).getTime())) {
    return fail('That deadline is not a valid date and time.')
  }

  try {
    await tablesDB.updateRow({
      databaseId,
      tableId: competitionsCollectionId,
      rowId: competitionId,
      data: { uploadDeadline },
    })
    revalidatePath('/admin/dashboard')
    revalidatePath('/dashboard')
    return ok({ uploadDeadline })
  } catch (error) {
    console.error('Error updating competition deadline:', error)
    const message = errorMessage(error)
    return fail(
      /unknown attribute|attribute not found|invalid document structure/i.test(
        message
      )
        ? 'The deadline column is missing. Open the Setup tab and run setup to add it, then try again.'
        : `Could not save the deadline: ${message}`
    )
  }
}

/**
 * Deadline for every competition that has one, keyed by competition ID. Used
 * to show locked music and closed competitions to competitors.
 */
export async function getCompetitionDeadlines(): Promise<
  Record<string, string>
> {
  try {
    const rows = await getAllDocuments(databaseId, competitionsCollectionId)
    const deadlines: Record<string, string> = {}
    for (const row of rows) {
      if (row.uploadDeadline) deadlines[row.$id] = row.uploadDeadline
    }
    return deadlines
  } catch (error) {
    console.error('Error fetching competition deadlines:', error)
    return {}
  }
}
