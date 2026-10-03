import { beforeEach, describe, expect, it, vi } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'

const m = vi.hoisted(() => ({
  admin: true,
  rows: [] as object[],
  download: vi.fn(),
  listError: null as Error | null,
}))

vi.mock('@/lib/auth/guards', () => ({
  getAdminUser: async () => (m.admin ? { $id: 'a', labels: ['admin'] } : null),
}))
vi.mock('@/lib/appwrite/server', () => ({
  storage: { getFileDownload: m.download },
  Query: { equal: (k: string, v: unknown) => `equal(${k},${v})` },
}))
vi.mock('@/lib/appwrite/rows', () => ({
  listAllRows: async () => {
    if (m.listError) throw m.listError
    return m.rows
  },
}))
vi.stubEnv('APPWRITE_BUCKET_ID', 'bucket')
vi.stubEnv('APPWRITE_MUSIC_FILES_COLLECTION_ID', 'musicfiles')

const { GET } = await import('@/app/api/music/export/route')

const row = (id: string, over: object = {}) => ({
  $id: id,
  fileId: `file-${id}`,
  originalName: `${id}.mp3`,
  competitionName: 'Winter Cup',
  competitionYear: 2026,
  gradeType: 'Singles',
  gradeCategory: 'Junior Girls',
  gradeSegment: 'Free Skate',
  userName: `Skater ${id}`,
  uploadedAt: '2026-06-01T00:00:00Z',
  duration: 100,
  size: 4,
  ...over,
})

const url = (qs: string) => new Request(`http://x/api/music/export?${qs}`)

beforeEach(() => {
  vi.clearAllMocks()
  m.admin = true
  m.listError = null
  m.rows = [row('b'), row('a', { gradeSegment: 'Short Program' })]
  m.download.mockImplementation(
    async (_b: string, fileId: string) =>
      new TextEncoder().encode(`audio:${fileId}`).buffer
  )
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('export route: who and what', () => {
  it('refuses anyone who is not an admin', async () => {
    m.admin = false
    const response = await GET(url('competitionId=c1'))
    expect(response.status).toBe(403)
    expect(m.download).not.toHaveBeenCalled()
  })

  it('needs a competition and a known order', async () => {
    expect((await GET(url(''))).status).toBe(400)
    expect((await GET(url('competitionId=c1&order=random'))).status).toBe(400)
  })

  it('says so when no music exists yet', async () => {
    m.rows = []
    const response = await GET(url('competitionId=c1'))
    expect(response.status).toBe(404)
    expect((await response.json()).error).toContain('No music')
  })

  it('reports a failure to list the files as a readable error', async () => {
    m.listError = new Error('appwrite down')
    const response = await GET(url('competitionId=c1'))
    expect(response.status).toBe(500)
    expect((await response.json()).error).toContain('appwrite down')
  })

  it('answers a preflight with the count, size and file name only', async () => {
    const response = await GET(
      url('competitionId=c1&order=segment&preflight=1')
    )
    expect(await response.json()).toEqual({
      count: 2,
      bytes: 8,
      filename: '2026-winter-cup-music-by-segment.zip',
    })
    expect(m.download).not.toHaveBeenCalled()
  })
})

describe('export route: the zip', () => {
  it('contains every file in running order, plus a manifest', async () => {
    const response = await GET(url('competitionId=c1&order=grade'))
    expect(response.headers.get('content-type')).toBe('application/zip')
    expect(response.headers.get('content-disposition')).toContain(
      '2026-winter-cup-music-by-grade.zip'
    )
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()))
    // Free Skate sorts after Short Program within a grade
    expect(Object.keys(files).filter((n) => n !== 'manifest.csv')).toEqual([
      '001-junior-girls-short-program-skater-a.mp3',
      '002-junior-girls-free-skate-skater-b.mp3',
    ])
    expect(
      strFromU8(files['001-junior-girls-short-program-skater-a.mp3'])
    ).toBe('audio:file-a')
    expect(strFromU8(files['manifest.csv'])).toContain('Skater a')
    expect(files['problems.txt']).toBeUndefined()
  })

  it('lists any file it could not read instead of dropping it silently', async () => {
    m.download.mockImplementation(async (_b: string, fileId: string) => {
      if (fileId === 'file-b') throw new Error('storage timeout')
      return new TextEncoder().encode('ok').buffer
    })
    const response = await GET(url('competitionId=c1&order=grade'))
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()))
    expect(files['001-junior-girls-short-program-skater-a.mp3']).toBeDefined()
    expect(files['002-junior-girls-free-skate-skater-b.mp3']).toBeUndefined()
    const problems = strFromU8(files['problems.txt'])
    expect(problems).toContain('002-junior-girls-free-skate-skater-b.mp3')
    expect(problems).toContain('storage timeout')
  })
})
