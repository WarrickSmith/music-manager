import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  session: null as null | {
    $id: string
    name: string
    email: string
    labels: string[]
  },
  listRows: vi.fn(),
  fetchStoredFile: vi.fn(),
  storeMusicFile: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/auth-service', () => ({
  getCurrentUser: async () => m.session,
}))
vi.mock('@/lib/appwrite/server', () => ({
  tablesDB: { listRows: m.listRows },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${v})`,
    limit: (n: number) => `limit(${n})`,
  },
}))
vi.mock('@/lib/appwrite/storage-proxy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/appwrite/storage-proxy')>()),
  fetchStoredFile: m.fetchStoredFile,
}))
vi.mock('@/lib/music/upload-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/music/upload-service')>()),
  storeMusicFile: m.storeMusicFile,
}))

vi.stubEnv('APPWRITE_DATABASE_ID', 'db')
vi.stubEnv('APPWRITE_MUSIC_FILES_COLLECTION_ID', 'musicfiles')

const file = await import('@/app/api/music/file/[fileId]/route')
const upload = await import('@/app/api/music/upload/route')
const {
  UploadConflictError,
  UploadDeadlineError,
  UploadNeedsRepairError,
  UploadValidationError,
} = await import('@/lib/music/upload-service')
const { isSameOrigin } = await import('@/lib/security/request')

const mia = { $id: 'u1', name: 'Mia', email: 'm@x.io', labels: ['competitor'] }
const bob = { $id: 'u2', name: 'Bob', email: 'b@x.io', labels: ['competitor'] }
const admin = { $id: 'a1', name: 'Admin', email: 'a@x.io', labels: ['admin'] }

const get = (id: string, init?: RequestInit, query = '') =>
  file.GET(new Request(`http://app.test/api/music/file/${id}${query}`, init), {
    params: Promise.resolve({ fileId: id }),
  })

beforeEach(() => {
  vi.clearAllMocks()
  m.session = null
  m.listRows.mockResolvedValue({
    rows: [{ userId: 'u1', originalName: 'Swan “Lake”.mp3', fileName: 'x' }],
  })
  m.fetchStoredFile.mockResolvedValue(
    new Response('audio-bytes', {
      status: 200,
      headers: { 'content-type': 'audio/mpeg', 'content-length': '11' },
    })
  )
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/music/file/[fileId]', () => {
  it('answers 401 when signed out and never reads storage', async () => {
    const res = await get('abc123')
    expect(res.status).toBe(401)
    expect(m.fetchStoredFile).not.toHaveBeenCalled()
  })

  it('rejects malformed file IDs before any lookup', async () => {
    m.session = mia
    expect((await get('../etc/passwd')).status).toBe(404)
    expect(m.listRows).not.toHaveBeenCalled()
  })

  it('answers 404, not 403, for another skater, so IDs do not leak', async () => {
    m.session = bob
    expect((await get('abc123')).status).toBe(404)
    expect(m.fetchStoredFile).not.toHaveBeenCalled()
  })

  it('answers 404 for a file with no record', async () => {
    m.session = mia
    m.listRows.mockResolvedValue({ rows: [] })
    expect((await get('abc123')).status).toBe(404)
  })

  it('streams the owner their file with safe headers', async () => {
    m.session = mia
    const res = await get('abc123')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('audio-bytes')
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('content-disposition')).toMatch(/^inline;/)
  })

  it('lets an admin read anyone’s file, as a download when asked', async () => {
    m.session = admin
    const res = await get('abc123', undefined, '?download=1')
    expect(res.status).toBe(200)
    const disposition = res.headers.get('content-disposition')!
    expect(disposition).toMatch(/^attachment;/)
    expect(disposition).not.toContain('"Lake"')
    expect(disposition).toContain("filename*=UTF-8''")
  })

  it('passes Range through and returns partial content', async () => {
    m.session = mia
    m.fetchStoredFile.mockResolvedValue(
      new Response('udio', {
        status: 206,
        headers: {
          'content-type': 'audio/mpeg',
          'content-range': 'bytes 1-4/11',
          'content-length': '4',
        },
      })
    )
    const res = await get('abc123', { headers: { range: 'bytes=1-4' } })
    expect(m.fetchStoredFile).toHaveBeenCalledWith('abc123', 'bytes=1-4')
    expect(res.status).toBe(206)
    expect(res.headers.get('content-range')).toBe('bytes 1-4/11')
  })

  it('never serves a non-audio type as itself', async () => {
    m.session = mia
    m.fetchStoredFile.mockResolvedValue(
      new Response('<script>', { headers: { 'content-type': 'text/html' } })
    )
    const res = await get('abc123')
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
  })

  it('hides storage errors behind a reference code', async () => {
    m.session = mia
    m.fetchStoredFile.mockRejectedValue(new Error('secret internal host down'))
    const res = await get('abc123')
    expect(res.status).toBe(502)
    const body = JSON.stringify(await res.json())
    expect(body).toMatch(/Reference [0-9a-f]{8}/)
    expect(body).not.toContain('secret')
  })
})

const post = (
  headers: Record<string, string> = {},
  body: BodyInit = new FormData()
) =>
  upload.POST(
    new Request('http://app.test/api/music/upload', {
      method: 'POST',
      headers: { host: 'app.test', ...headers },
      body,
    })
  )

describe('POST /api/music/upload', () => {
  it('blocks cross-site posts', async () => {
    m.session = mia
    expect((await post({ origin: 'https://evil.test' })).status).toBe(403)
    expect((await post({ 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect(m.storeMusicFile).not.toHaveBeenCalled()
  })

  it('answers 401 when signed out', async () => {
    const res = await post({ origin: 'http://app.test' })
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('signed-out')
    expect(m.storeMusicFile).not.toHaveBeenCalled()
  })

  it('rejects an oversized body up front with 413', async () => {
    m.session = mia
    const res = await post({ 'content-length': String(20 * 1024 * 1024) })
    expect(res.status).toBe(413)
    expect(m.storeMusicFile).not.toHaveBeenCalled()
  })

  it('stores the music as the signed-in user', async () => {
    m.session = mia
    m.storeMusicFile.mockResolvedValue({ $id: 'row' })
    const res = await post({ origin: 'http://app.test' })
    expect(res.status).toBe(200)
    expect(m.storeMusicFile.mock.calls[0][1]).toEqual({
      id: 'u1',
      name: 'Mia',
      isAdmin: false,
    })
  })

  it('maps conflict, deadline and validation errors', async () => {
    m.session = mia
    m.storeMusicFile.mockRejectedValueOnce(
      new UploadConflictError({
        id: 'r',
        originalName: 'a.mp3',
        uploadedAt: '',
        size: 1,
        duration: null,
      })
    )
    expect((await post()).status).toBe(409)
    m.storeMusicFile.mockRejectedValueOnce(new UploadDeadlineError('closed'))
    expect((await post()).status).toBe(403)
    m.storeMusicFile.mockRejectedValueOnce(new UploadValidationError('bad'))
    expect((await post()).status).toBe(400)
    m.storeMusicFile.mockRejectedValueOnce(new UploadNeedsRepairError())
    const repair = await post()
    expect(repair.status).toBe(422)
    expect((await repair.json()).code).toBe('needs-repair')
  })

  it('hides unexpected errors behind a reference code', async () => {
    m.session = mia
    m.storeMusicFile.mockRejectedValueOnce(new Error('db password leaked'))
    const res = await post()
    expect(res.status).toBe(500)
    const text = JSON.stringify(await res.json())
    expect(text).toMatch(/reference [0-9a-f]{8}/)
    expect(text).not.toContain('password')
  })
})

describe('isSameOrigin', () => {
  const req = (headers: Record<string, string>) =>
    new Request('http://app.test/x', { method: 'POST', headers })

  it('accepts same-origin and non-browser requests', () => {
    expect(
      isSameOrigin(req({ host: 'app.test', origin: 'http://app.test' }))
    ).toBe(true)
    expect(isSameOrigin(req({ host: 'app.test' }))).toBe(true)
    expect(isSameOrigin(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
  })

  it('rejects other origins, cross-site fetches and bad origins', () => {
    expect(
      isSameOrigin(req({ host: 'app.test', origin: 'http://evil.test' }))
    ).toBe(false)
    expect(isSameOrigin(req({ 'sec-fetch-site': 'same-site' }))).toBe(false)
    expect(isSameOrigin(req({ host: 'app.test', origin: 'not a url' }))).toBe(
      false
    )
  })

  it('honours x-forwarded-host behind a proxy', () => {
    expect(
      isSameOrigin(
        req({
          host: 'internal:3000',
          'x-forwarded-host': 'music.club.org',
          origin: 'https://music.club.org',
        })
      )
    ).toBe(true)
  })
})
