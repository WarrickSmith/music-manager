'use server'

import { databases, ID, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const gradesCollectionId = process.env.APPWRITE_GRADES_COLLECTION_ID!

export async function getGradesByCompetition(competitionId: string) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      gradesCollectionId,
      [Query.equal('competitionId', competitionId), Query.limit(100)]
    )

    return response.documents
  } catch (error) {
    console.error('Error fetching grades:', error)
    throw new Error('Failed to fetch grades')
  }
}

export async function createGrade({
  name,
  category,
  segment,
  competitionId,
}: {
  name: string
  category: string
  segment: string
  competitionId: string
}) {
  try {
    const result = await databases.createDocument(
      databaseId,
      gradesCollectionId,
      ID.unique(),
      {
        name,
        category,
        segment,
        competitionId,
      }
    )

    revalidatePath('/admin/dashboard')
    return result
  } catch (error) {
    console.error('Error creating grade:', error)
    throw new Error('Failed to create grade')
  }
}

export async function updateGrade(
  gradeId: string,
  data: {
    name?: string
    category?: string
    segment?: string
  }
) {
  try {
    const result = await databases.updateDocument(
      databaseId,
      gradesCollectionId,
      gradeId,
      data
    )

    revalidatePath('/admin/dashboard')
    return result
  } catch (error) {
    console.error('Error updating grade:', error)
    throw new Error('Failed to update grade')
  }
}

export async function deleteGrade(gradeId: string) {
  try {
    await databases.deleteDocument(databaseId, gradesCollectionId, gradeId)

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error deleting grade:', error)
    throw new Error('Failed to delete grade')
  }
}
