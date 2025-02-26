import { databases } from '@/lib/appwrite-config'
import { Query } from 'appwrite'
import { NextRequest, NextResponse } from 'next/server'
import { processAllDocuments } from '@/lib/utils'

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

    // 2. Clone all grades to new competition using pagination
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
    let gradesCopied = 0

    await processAllDocuments(
      async (offset, limit) => {
        return await databases.listDocuments(databaseId, 'grades', [
          Query.equal('competitionId', sourceCompetitionId),
          Query.limit(limit),
          Query.offset(offset),
        ])
      },
      async (grades) => {
        await Promise.all(
          grades.map((grade) =>
            databases.createDocument(databaseId, 'grades', 'unique()', {
              name: grade.name,
              category: grade.category,
              segment: grade.segment,
              competitionId: newCompetition.$id,
            })
          )
        )
        gradesCopied += grades.length
      }
    )

    console.log(
      `Cloned ${gradesCopied} grades to new competition ${newCompetition.$id}`
    )

    return NextResponse.json({
      competition: newCompetition,
      gradesCopied,
    })
  } catch (error) {
    console.error('Failed to clone competition:', error)
    return NextResponse.json(
      { error: 'Failed to clone competition' },
      { status: 500 }
    )
  }
}
