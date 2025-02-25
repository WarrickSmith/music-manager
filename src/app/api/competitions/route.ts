import { databases, storage } from '@/lib/appwrite-config'
import { Query } from 'appwrite'
import { NextRequest, NextResponse } from 'next/server'

// List competitions
export async function GET() {
  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      [Query.orderDesc('year'), Query.orderDesc('$createdAt')]
    )
    return NextResponse.json({ competitions: response.documents })
  } catch (error) {
    console.error('Failed to fetch competitions:', error)
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
    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      'unique()',
      {
        name: body.name,
        year: body.year,
        active: body.active ?? true,
      }
    )
    return NextResponse.json({ competition: response })
  } catch (error) {
    console.error('Failed to create competition:', error)
    return NextResponse.json(
      { error: 'Failed to create competition' },
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
  } catch (error) {
    console.error('Failed to update competition:', error)
    return NextResponse.json(
      { error: 'Failed to update competition' },
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

    // 1. Get all music files associated with this competition
    const musicFiles = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'music_files',
      [Query.equal('competitionId', competitionId)]
    )

    // 2. Delete files from storage
    await Promise.all(
      musicFiles.documents.map(async (file) => {
        try {
          await storage.deleteFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID as string,
            file.fileId
          )
        } catch (err) {
          console.error(`Failed to delete file ${file.fileId}:`, err)
          // Continue with other deletions even if one fails
        }
      })
    )

    // 3. Delete music file records
    await Promise.all(
      musicFiles.documents.map((file) =>
        databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
          'music_files',
          file.$id
        )
      )
    )

    // 4. Delete all grades associated with this competition
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

    // 5. Finally delete the competition
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string,
      'competitions',
      competitionId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete competition:', error)
    return NextResponse.json(
      { error: 'Failed to delete competition' },
      { status: 500 }
    )
  }
}
