import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  storeMusicFile,
  UploadConflictError,
  UploadDeadlineError,
  UploadValidationError,
} from '@/lib/music/upload-service'
import { getSessionUser, isAdminUser } from '@/lib/auth/guards'

/**
 * Receives a music file upload. The browser posts here with XMLHttpRequest so
 * it can show real upload progress, which a server action cannot report.
 * Errors come back as JSON with a plain message the page can show.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const actor = { isAdmin: isAdminUser(await getSessionUser()) }
    const musicFile = await storeMusicFile(formData, actor)
    revalidatePath('/dashboard')
    return NextResponse.json({ success: true, musicFile })
  } catch (error) {
    if (error instanceof UploadConflictError) {
      return NextResponse.json(
        {
          success: false,
          code: 'exists',
          error: error.message,
          existing: error.existing,
        },
        { status: 409 }
      )
    }
    if (error instanceof UploadDeadlineError) {
      return NextResponse.json(
        { success: false, code: 'deadline', error: error.message },
        { status: 403 }
      )
    }
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    console.error('Error uploading music file:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to save the music file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 }
    )
  }
}
