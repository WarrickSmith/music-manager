import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  MAX_UPLOAD_BYTES,
  storeMusicFile,
  UploadConflictError,
  UploadDeadlineError,
  UploadValidationError,
} from '@/lib/music/upload-service'
import {
  getSessionUser,
  isAdminUser,
  NOT_SIGNED_IN_MESSAGE,
} from '@/lib/auth/guards'
import { errorReference, isSameOrigin } from '@/lib/security/request'

// The file plus the other form fields; more than this is not a valid upload
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Receives a music file upload. The browser posts here with XMLHttpRequest so
 * it can show real upload progress, which a server action cannot report.
 *
 * Only signed-in users may upload, and the music is recorded against the
 * signed-in user. Errors come back as JSON with a plain message the page can
 * show; unexpected failures return a reference code instead of internal
 * details, and the details go to the server log under that code.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json(
      { success: false, code: 'forbidden', error: 'This request was blocked.' },
      403
    )
  }

  const user = await getSessionUser()
  if (!user) {
    return json(
      { success: false, code: 'signed-out', error: NOT_SIGNED_IN_MESSAGE },
      401
    )
  }

  const length = Number(request.headers.get('content-length'))
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return json(
      { success: false, error: 'File size must be less than 15MB.' },
      413
    )
  }

  try {
    const formData = await request.formData()
    const musicFile = await storeMusicFile(formData, {
      id: user.$id,
      name: user.name || user.email.split('@')[0],
      isAdmin: isAdminUser(user),
    })
    revalidatePath('/dashboard')
    return json({ success: true, musicFile }, 200)
  } catch (error) {
    if (error instanceof UploadConflictError) {
      return json(
        {
          success: false,
          code: 'exists',
          error: error.message,
          existing: error.existing,
        },
        409
      )
    }
    if (error instanceof UploadDeadlineError) {
      return json(
        { success: false, code: 'deadline', error: error.message },
        403
      )
    }
    if (error instanceof UploadValidationError) {
      return json({ success: false, error: error.message }, 400)
    }
    const reference = errorReference()
    console.error(`Error uploading music file [${reference}]:`, error)
    return json(
      {
        success: false,
        error: `Something went wrong saving your file. Try again, and if it keeps happening tell a club admin and quote reference ${reference}.`,
      },
      500
    )
  }
}
