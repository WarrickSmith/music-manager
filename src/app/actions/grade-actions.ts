'use server'

import { tablesDB, ID, Query } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { toPlainObject } from '@/lib/utils'
import { requireAdmin } from '@/lib/auth/guards'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const gradesCollectionId = process.env.APPWRITE_GRADES_COLLECTION_ID!

export async function getGradesByCompetition(competitionId: string) {
  await requireAdmin()
  try {
    const response = await tablesDB.listRows({
      databaseId,
      tableId: gradesCollectionId,
      queries: [Query.equal('competitionId', competitionId), Query.limit(100)],
    })

    return toPlainObject(response.rows)
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
  await requireAdmin()
  const fields = [name, category, segment].map((v) => v.trim())
  if (fields.some((v) => !v || v.length > 255)) {
    throw new Error(
      'Name, category and segment must each be 1 to 255 characters.'
    )
  }
  try {
    const result = await tablesDB.createRow({
      databaseId,
      tableId: gradesCollectionId,
      rowId: ID.unique(),
      data: {
        name,
        category,
        segment,
        competitionId,
      },
    })

    revalidatePath('/admin/dashboard')
    return toPlainObject(result)
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
  await requireAdmin()
  for (const value of [data.name, data.category, data.segment]) {
    if (value !== undefined && (!value.trim() || value.length > 255)) {
      throw new Error(
        'Name, category and segment must each be 1 to 255 characters.'
      )
    }
  }
  try {
    const result = await tablesDB.updateRow({
      databaseId,
      tableId: gradesCollectionId,
      rowId: gradeId,
      data,
    })

    revalidatePath('/admin/dashboard')
    return toPlainObject(result)
  } catch (error) {
    console.error('Error updating grade:', error)
    throw new Error('Failed to update grade')
  }
}

export async function deleteGrade(gradeId: string) {
  await requireAdmin()
  try {
    await tablesDB.deleteRow({
      databaseId,
      tableId: gradesCollectionId,
      rowId: gradeId,
    })

    revalidatePath('/admin/dashboard')
    return true
  } catch (error) {
    console.error('Error deleting grade:', error)
    throw new Error('Failed to delete grade')
  }
}
