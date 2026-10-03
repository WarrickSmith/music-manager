import { NextResponse } from 'next/server'
import { tablesDB, Query } from '@/lib/appwrite/server'
import { getSessionUser, isAdminUser } from '@/lib/auth/guards'
import { fetchStoredFile, isValidFileId } from '@/lib/appwrite/storage-proxy'
import { errorReference } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/aac',
])

const json = (error: string, status: number) =>
  NextResponse.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } }
  )

/** A Content-Disposition value with an ASCII fallback and the full UTF-8 name */
function disposition(kind: 'inline' | 'attachment', name: string): string {
  const clean = name.replace(/[\r\n"\\/]/g, '').trim() || 'music'
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_')
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`
}

/**
 * Stream or download one stored music file. The signed-in user must own the
 * file, or be an admin. Range requests are passed through so the player can
 * seek. Add ?download=1 to download instead of play.
 *
 * Someone else's file answers 404, the same as a file that does not exist, so
 * the response does not reveal which file IDs exist.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  if (!isValidFileId(fileId)) return json('Not found.', 404)

  const user = await getSessionUser()
  if (!user) return json('Please sign in again.', 401)

  let row
  try {
    const found = await tablesDB.listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      tableId: process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!,
      queries: [Query.equal('fileId', fileId), Query.limit(1)],
    })
    row = found.rows[0]
  } catch (error) {
    const reference = errorReference()
    console.error(`Error looking up music file [${reference}]:`, error)
    return json(`Could not load the file. Reference ${reference}.`, 500)
  }
  if (!row || (row.userId !== user.$id && !isAdminUser(user))) {
    return json('Not found.', 404)
  }

  let upstream: Response
  try {
    upstream = await fetchStoredFile(fileId, request.headers.get('range'))
  } catch (error) {
    const reference = errorReference()
    console.error(`Error reading music file [${reference}]:`, error)
    return json(`Could not load the file. Reference ${reference}.`, 502)
  }
  if (upstream.status === 404) return json('Not found.', 404)
  if (upstream.status === 416) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': upstream.headers.get('content-range') ?? '',
      },
    })
  }
  if (!upstream.ok || !upstream.body) {
    const reference = errorReference()
    console.error(`Storage returned ${upstream.status} [${reference}]`)
    return json(`Could not load the file. Reference ${reference}.`, 502)
  }

  const type = (upstream.headers.get('content-type') ?? '').split(';')[0].trim()
  const download = new URL(request.url).searchParams.get('download') === '1'
  const headers = new Headers({
    // Only audio types are served as such; anything else is an opaque download
    'Content-Type': AUDIO_TYPES.has(type) ? type : 'application/octet-stream',
    'Content-Disposition': disposition(
      download ? 'attachment' : 'inline',
      row.originalName || row.fileName
    ),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  for (const name of ['content-length', 'content-range']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new Response(upstream.body, { status: upstream.status, headers })
}
