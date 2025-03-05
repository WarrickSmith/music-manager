'use server'

import { databases, ID, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { defaultGrades } from '../../../Docs/default-grades'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const competitionsCollectionId =
  process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!
const gradesCollectionId = process.env.APPWRITE_GRADES_COLLECTION_ID!

/**
 * Utility function to fetch all documents with pagination
 * @param databaseId Database ID
 * @param collectionId Collection ID
 * @param queries Query parameters
 * @returns Array of all documents from all pages
 */
async function getAllDocuments(databaseId: string, collectionId: string, queries: any[] = []) {
  const limit = 100; // Maximum allowed by Appwrite
  let offset = 0;
  let allDocuments: any[] = [];
  let hasMoreDocuments = true;

  // Add limit to queries if not already specified
  const queriesWithLimit = [...queries, Query.limit(limit)];
  
  while (hasMoreDocuments) {
    // Add offset to queries
    const currentQueries = [...queriesWithLimit, Query.offset(offset)];
    
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      currentQueries
    );

    allDocuments = [...allDocuments, ...response.documents];
    
    // Check if there are more documents
    if (response.documents.length < limit) {
      hasMoreDocuments = false;
    } else {
      offset += limit;
    }
  }

  return allDocuments;
}

export async function getCompetitions() {
  try {
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
    // Delete all associated grades using pagination
    const grades = await getAllDocuments(
      databaseId,
      gradesCollectionId,
      [Query.equal('competitionId', competitionId)]
    )

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
