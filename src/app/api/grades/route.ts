import { databases } from '@/lib/appwrite-config'
import { Query } from 'appwrite'
import { NextRequest, NextResponse } from 'next/server'

// List grades for a competition
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Missing competition ID' },
        { status: 400 }
      )
    }

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      [
        Query.equal('competitionId', competitionId),
        Query.orderAsc('category'),
        Query.orderAsc('name'),
      ]
    )
    return NextResponse.json({ grades: response.documents })
  } catch (error) {
    console.error('Failed to fetch grades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}

// Create grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitionId, name, category, segment } = body

    if (!competitionId || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      'unique()',
      {
        name,
        category,
        segment: segment || null,
        competitionId,
      }
    )
    return NextResponse.json({ grade: response })
  } catch (error) {
    console.error('Failed to create grade:', error)
    return NextResponse.json(
      { error: 'Failed to create grade' },
      { status: 500 }
    )
  }
}

// Update grade
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { gradeId, ...data } = body

    if (!gradeId) {
      return NextResponse.json({ error: 'Missing grade ID' }, { status: 400 })
    }

    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      gradeId,
      data
    )
    return NextResponse.json({ grade: response })
  } catch (error) {
    console.error('Failed to update grade:', error)
    return NextResponse.json(
      { error: 'Failed to update grade' },
      { status: 500 }
    )
  }
}

// Delete grade
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { gradeId } = body

    if (!gradeId) {
      return NextResponse.json({ error: 'Missing grade ID' }, { status: 400 })
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'grades',
      gradeId
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete grade:', error)
    return NextResponse.json(
      { error: 'Failed to delete grade' },
      { status: 500 }
    )
  }
}
