import { databases } from '@/lib/appwrite-config'
import { Query } from 'appwrite'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceCompetitionId, ...newCompetitionData } = body

    if (!sourceCompetitionId) {
      return NextResponse.json(
        { error: 'Missing source competition ID' },
        { status: 400 }
      )
    }

    // 1. Create new competition
    const newCompetition = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      'unique()',
      {
        name: newCompetitionData.name,
        year: newCompetitionData.year,
        active: newCompetitionData.active ?? true,
      }
    )

    // 2. Get grades from source competition
    // Increase the limit to ensure we get all grades (default is 25 max is 100)
    const sourceGrades = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      [
        Query.equal('competitionId', sourceCompetitionId),
        Query.limit(100), // Increased limit to ensure all grades are retrieved
      ]
    )

    // 3. Clone all grades to new competition
    if (sourceGrades.documents.length > 0) {
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
              competitionId: newCompetition.$id,
            }
          )
        )
      )
    }

    return NextResponse.json({ competition: newCompetition })
  } catch (error) {
    console.error('Failed to clone competition:', error)
    return NextResponse.json(
      { error: 'Failed to clone competition' },
      { status: 500 }
    )
  }
}
