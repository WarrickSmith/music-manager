'use server'

import { databases, ID, Query } from '@/lib/appwrite/server'
import { Models } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { defaultGrades } from '../../../Docs/default-grades'
import { storage } from '@/lib/appwrite/server'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-service'

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
  let allDocuments: Models.Document[] = []
  let hasMoreDocuments = true

  // Add limit to queries if not already specified
  const queriesWithLimit = [...queries, Query.limit(limit)]

  while (hasMoreDocuments) {
    // Add offset to queries
    const currentQueries = [...queriesWithLimit, Query.offset(offset)]

    const response = await databases.listDocuments(
      databaseId,
      collectionId,
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
}

export async function getCompetitions() {
  try {
    // Check if Appwrite resources are initialized
    const { isInitialized } = await checkAppwriteInitialization()
    if (!isInitialized) {
      return []
    }

    const response = await databases.listDocuments(
      databaseId,
      competitionsCollectionId,
      [Query.orderDesc('year'), Query.orderAsc('name'), Query.limit(100)]
    )

    return response.documents
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
}: {
  name: string
  year: number
  active: boolean
  useDefaultGrades: boolean
  cloneFromCompetitionId?: string
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
    const competition = await databases.createDocument(
      databaseId,
      competitionsCollectionId,
      ID.unique(),
      {
        name,
        year,
        active,
      }
    )

    // Create associated grades
    if (useDefaultGrades) {
      // Use default grades from template
      for (const grade of defaultGrades) {
        await databases.createDocument(
          databaseId,
          gradesCollectionId,
          ID.unique(),
          {
            name: grade.name,
            category: grade.category,
            segment: grade.segment,
            competitionId: competition.$id,
          }
        )
      }
    } else if (cloneFromCompetitionId) {
      // Clone grades from existing competition using the pagination utility
      const existingGrades = await getAllDocuments(
        databaseId,
        gradesCollectionId,
        [Query.equal('competitionId', cloneFromCompetitionId)]
      )

      for (const grade of existingGrades) {
        await databases.createDocument(
          databaseId,
          gradesCollectionId,
          ID.unique(),
          {
            name: grade.name,
            category: grade.category,
            segment: grade.segment,
            competitionId: competition.$id,
          }
        )
      }
    }

    revalidatePath('/admin/dashboard')
    return competition
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

    const result = await databases.updateDocument(
      databaseId,
      competitionsCollectionId,
      competitionId,
      { active }
    )

    revalidatePath('/admin/dashboard')
    return result
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
        await databases.deleteDocument(
          databaseId,
          musicFilesCollectionId,
          file.$id
        )
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
      await databases.deleteDocument(databaseId, gradesCollectionId, grade.$id)
    }

    // Delete competition
    await databases.deleteDocument(
      databaseId,
      competitionsCollectionId,
      competitionId
    )

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

    const response = await databases.listDocuments(
      databaseId,
      competitionsCollectionId,
      [
        Query.equal('active', true),
        Query.orderDesc('year'),
        Query.orderAsc('name'),
      ]
    )
    return response.documents
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

    const response = await databases.listDocuments(
      databaseId,
      gradesCollectionId,
      queries
    )

    return response.documents
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

    const response = await databases.listDocuments(
      databaseId,
      gradesCollectionId,
      [Query.equal('competitionId', competitionId)]
    )

    const categories = new Set<string>()
    response.documents.forEach((doc) => {
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
