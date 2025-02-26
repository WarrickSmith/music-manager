import { databases } from '@/lib/appwrite-config'
import { Query } from 'appwrite'
import { NextRequest, NextResponse } from 'next/server'
import { defaultGrades } from '@/lib/default-grades'

interface AppwriteError extends Error {
  type?: string
  code?: number
  response?: unknown
}

// List competitions
export async function GET() {
  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      [Query.orderDesc('year'), Query.orderDesc('$createdAt')]
    )
    return NextResponse.json({ competitions: response.documents })
  } catch (error: unknown) {
    console.error('Failed to fetch competitions:', error)

    // Check for database not found error
    const appwriteError = error as AppwriteError
    if (appwriteError?.type === 'database_not_found') {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    )
  }
}

// Create competition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, year, sourceCompetitionId } = body

    // Create the competition
    const competition = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      'unique()',
      {
        name,
        year,
        active: true,
      }
    )

    // Create grades based on source or defaults
    if (sourceCompetitionId) {
      // Clone grades from existing competition
      const sourceGrades = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
        'grades',
        [Query.equal('competitionId', sourceCompetitionId)]
      )

      // Create cloned grades
      await Promise.all(
        sourceGrades.documents.map((grade) =>
          databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
            'grades',
            'unique()',
            {
              name: grade.name,
              category: grade.category,
              segment: grade.segment,
              competitionId: competition.$id,
            }
          )
        )
      )
    } else {
      // Create default grades
      await Promise.all(
        defaultGrades.map((grade) =>
          databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
            'grades',
            'unique()',
            {
              ...grade,
              competitionId: competition.$id,
            }
          )
        )
      )
    }

    return NextResponse.json({ competition })
  } catch (error: unknown) {
    console.error('Failed to create competition:', error)
    const appwriteError = error as AppwriteError
    return NextResponse.json(
      { error: 'Failed to create competition', details: appwriteError.message },
      { status: 500 }
    )
  }
}

// Update competition
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitionId, ...data } = body

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Missing competition ID' },
        { status: 400 }
      )
    }

    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      competitionId,
      data
    )
    return NextResponse.json({ competition: response })
  } catch (error: unknown) {
    console.error('Failed to update competition:', error)
    const appwriteError = error as AppwriteError
    return NextResponse.json(
      { error: 'Failed to update competition', details: appwriteError.message },
      { status: 500 }
    )
  }
}

// Delete competition
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitionId } = body

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Missing competition ID' },
        { status: 400 }
      )
    }

    // 1. Delete all grades associated with this competition
    const grades = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      [Query.equal('competitionId', competitionId)]
    )

    await Promise.all(
      grades.documents.map((grade) =>
        databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
          'grades',
          grade.$id
        )
      )
    )

    // 2. Delete the competition
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      competitionId
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete competition:', error)
    const appwriteError = error as AppwriteError
    return NextResponse.json(
      { error: 'Failed to delete competition', details: appwriteError.message },
      { status: 500 }
    )
  }
}
