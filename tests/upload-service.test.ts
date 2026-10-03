import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: string[] = []
const mocks = vi.hoisted(() => ({
  getRow: vi.fn(),
  createRow: vi.fn(),
  deleteRow: vi.fn(),
  listRows: vi.fn(),
  createFile: vi.fn(),
  deleteFile: vi.fn(),
}))

vi.mock('@/lib/appwrite/server', () => ({
  tablesDB: {
    getRow: mocks.getRow,
    createRow: mocks.createRow,
    deleteRow: mocks.deleteRow,
    listRows: mocks.listRows,
  },
  storage: { createFile: mocks.createFile, deleteFile: mocks.deleteFile },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${v})`,
    orderDesc: (k: string) => `orderDesc(${k})`,
    limit: (n: number) => `limit(${n})`,
  },
}))

vi.stubEnv('APPWRITE_DATABASE_ID', 'db')
vi.stubEnv('APPWRITE_BUCKET_ID', 'bucket')
vi.stubEnv('APPWRITE_MUSIC_FILES_COLLECTION_ID', 'musicfiles')
vi.stubEnv('APPWRITE_COMPETITIONS_COLLECTION_ID', 'competitions')
vi.stubEnv('APPWRITE_GRADES_COLLECTION_ID', 'grades')

const { ffmpegAvailable } = await import('@/lib/music/audio-repair')
const hasFfmpeg = await ffmpegAvailable()

const {
  storeMusicFile,
  UploadConflictError,
  UploadDeadlineError,
  UploadNeedsRepairError,
  UploadValidationError,
} = await import('@/lib/music/upload-service')

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/audio/${name}`, import.meta.url))

const skater = { id: 'u1', name: 'Mia Kowalski', isAdmin: false }
const admin = { id: 'a1', name: 'Club Admin', isAdmin: true }

const FUTURE = new Date(Date.now() + 7 * 864e5).toISOString()
const PAST = new Date(Date.now() - 864e5).toISOString()

function form(extra: Record<string, string> = {}, file?: File) {
  const data = new FormData()
  data.set(
    'file',
    file ?? new File([fixture('tone.mp3')], 'swan.mp3', { type: 'audio/mpeg' })
  )
  data.set('competitionId', 'c1')
  data.set('gradeId', 'g1')
  for (const [k, v] of Object.entries(extra)) data.set(k, v)
  return data
}

function setup(
  opts: { deadline?: string; existing?: object[]; active?: boolean } = {}
) {
  mocks.getRow.mockImplementation(async ({ tableId }: { tableId: string }) =>
    tableId === 'competitions'
      ? {
          name: 'Winter Cup',
          year: 2026,
          active: opts.active ?? true,
          uploadDeadline: opts.deadline,
        }
      : {
          name: 'Singles',
          category: 'Junior Girls',
          segment: 'Free Skate',
          competitionId: 'c1',
        }
  )
  mocks.listRows.mockResolvedValue({ rows: opts.existing ?? [] })
}

beforeEach(() => {
  calls.length = 0
  vi.clearAllMocks()
  mocks.createFile.mockImplementation(async () => {
    calls.push('createFile')
    return { $id: 'stored-file' }
  })
  mocks.createRow.mockImplementation(async ({ data }: { data: object }) => {
    calls.push('createRow')
    return { $id: 'new-row', ...data }
  })
  mocks.deleteFile.mockImplementation(async (_b: string, id: string) => {
    calls.push(`deleteFile:${id}`)
  })
  mocks.deleteRow.mockImplementation(async ({ rowId }: { rowId: string }) => {
    calls.push(`deleteRow:${rowId}`)
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const oldRow = {
  $id: 'old-row',
  fileId: 'old-file',
  originalName: 'cued.wav',
  uploadedAt: '2026-06-01T00:00:00Z',
  size: 100,
  duration: 5,
}

describe('storeMusicFile: validation', () => {
  it('rejects missing details, wrong types and oversized files', async () => {
    setup()
    await expect(
      storeMusicFile(form({ gradeId: '' }), skater)
    ).rejects.toBeInstanceOf(UploadValidationError)
    await expect(
      storeMusicFile(
        form({}, new File(['x'], 'a.txt', { type: 'text/plain' })),
        skater
      )
    ).rejects.toThrow('audio')
    const big = new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'big.mp3', {
      type: 'audio/mpeg',
    })
    await expect(storeMusicFile(form({}, big), skater)).rejects.toThrow('15MB')
    expect(mocks.createFile).not.toHaveBeenCalled()
  })
})

describe('storeMusicFile: deadline', () => {
  it('stops a competitor after the deadline and stores nothing', async () => {
    setup({ deadline: PAST })
    await expect(storeMusicFile(form(), skater)).rejects.toBeInstanceOf(
      UploadDeadlineError
    )
    expect(mocks.createFile).not.toHaveBeenCalled()
  })

  it('lets a competitor upload before the deadline', async () => {
    setup({ deadline: FUTURE })
    await expect(storeMusicFile(form(), skater)).resolves.toBeDefined()
  })

  it('lets an admin upload after the deadline', async () => {
    setup({ deadline: PAST })
    await expect(storeMusicFile(form(), admin)).resolves.toBeDefined()
  })

  it('treats a competition with no deadline as always open', async () => {
    setup()
    await expect(storeMusicFile(form(), skater)).resolves.toBeDefined()
  })

  it('checks the deadline before looking for an existing file', async () => {
    setup({ deadline: PAST, existing: [oldRow] })
    await expect(storeMusicFile(form(), skater)).rejects.toBeInstanceOf(
      UploadDeadlineError
    )
  })
})

describe('storeMusicFile: one file per grade', () => {
  it('refuses a second file unless it is a confirmed replace', async () => {
    setup({ existing: [oldRow] })
    const error = await storeMusicFile(form(), skater).catch((e) => e)
    expect(error).toBeInstanceOf(UploadConflictError)
    expect(error.existing).toMatchObject({
      id: 'old-row',
      originalName: 'cued.wav',
      duration: 5,
    })
    expect(mocks.createFile).not.toHaveBeenCalled()
  })

  it('looks only at this skater and grade', async () => {
    setup()
    await storeMusicFile(form(), skater)
    const queries = mocks.listRows.mock.calls[0][0].queries
    expect(queries).toContain('equal(userId,u1)')
    expect(queries).toContain('equal(gradeId,g1)')
  })

  it('stores the new file first and only then removes the old one', async () => {
    setup({ existing: [oldRow] })
    await storeMusicFile(form({ replace: 'true' }), skater)
    expect(calls).toEqual([
      'createFile',
      'createRow',
      'deleteFile:old-file',
      'deleteRow:old-row',
    ])
  })

  it('keeps the old file if the new upload fails', async () => {
    setup({ existing: [oldRow] })
    mocks.createFile.mockRejectedValueOnce(new Error('storage down'))
    await expect(
      storeMusicFile(form({ replace: 'true' }), skater)
    ).rejects.toThrow('storage down')
    expect(mocks.deleteFile).not.toHaveBeenCalled()
    expect(mocks.deleteRow).not.toHaveBeenCalled()
  })

  it('still succeeds if the old file cannot be removed afterwards', async () => {
    setup({ existing: [oldRow] })
    mocks.deleteFile.mockRejectedValueOnce(new Error('already gone'))
    await expect(
      storeMusicFile(form({ replace: 'true' }), skater)
    ).resolves.toBeDefined()
    expect(mocks.deleteRow).toHaveBeenCalled()
  })

  it('does not delete anything for a first upload', async () => {
    setup()
    await storeMusicFile(form(), skater)
    expect(mocks.deleteFile).not.toHaveBeenCalled()
    expect(mocks.deleteRow).not.toHaveBeenCalled()
  })
})

describe('storeMusicFile: identity and content', () => {
  it('uses the signed-in user and ignores user fields from the form', async () => {
    setup()
    await storeMusicFile(
      form({ userId: 'someone-else', userName: 'Someone Else' }),
      skater
    )
    expect(mocks.listRows.mock.calls[0][0].queries).toContain(
      'equal(userId,u1)'
    )
    expect(mocks.createRow.mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      userName: 'Mia Kowalski',
    })
  })

  it('lets an admin upload on behalf of a skater', async () => {
    setup()
    await storeMusicFile(form({ userId: 'u9', userName: 'Zoe Park' }), admin)
    expect(mocks.createRow.mock.calls[0][0].data).toMatchObject({
      userId: 'u9',
      userName: 'Zoe Park',
    })
  })

  it('rejects text, video and other non-audio content with an audio name', async () => {
    setup()
    for (const name of [
      'fake.html',
      'video.mp4',
      'empty.mp3',
      'truncated.wav',
    ]) {
      const file = new File([fixture(name)], 'song.mp3', { type: 'audio/mpeg' })
      await expect(
        storeMusicFile(form({}, file), skater)
      ).rejects.toBeInstanceOf(UploadValidationError)
    }
    expect(mocks.createFile).not.toHaveBeenCalled()
  })

  it('takes the extension, type and length from the content', async () => {
    setup()
    const file = new File([fixture('tone.m4a')], 'whatever.mp3', {
      type: 'audio/mpeg',
    })
    await storeMusicFile(form({}, file), skater)
    const stored = mocks.createFile.mock.calls[0][2] as File
    expect(stored.name.endsWith('.m4a')).toBe(true)
    expect(mocks.createRow.mock.calls[0][0].data.duration).toBeGreaterThan(0)
  })

  it('refuses a grade from a different competition', async () => {
    setup()
    await expect(
      storeMusicFile(form({ competitionId: 'c2' }), skater)
    ).rejects.toThrow('does not belong')
  })

  it('keeps competitors out of an inactive competition but not admins', async () => {
    setup({ active: false })
    await expect(storeMusicFile(form(), skater)).rejects.toThrow('not open')
    await expect(storeMusicFile(form(), admin)).resolves.toBeDefined()
  })
})

describe.skipIf(!hasFfmpeg)('storeMusicFile: browser-unplayable files', () => {
  const damaged = () =>
    new File([fixture('damaged.mp3')], 'Song.MP3', { type: 'audio/mpeg' })

  it('stops and offers a repair, storing nothing', async () => {
    setup()
    await expect(
      storeMusicFile(form({}, damaged()), skater)
    ).rejects.toBeInstanceOf(UploadNeedsRepairError)
    expect(mocks.createFile).not.toHaveBeenCalled()
    expect(mocks.createRow).not.toHaveBeenCalled()
  })

  it('stores the repaired copy once the skater agrees', async () => {
    setup()
    await storeMusicFile(form({ repair: 'true' }, damaged()), skater)
    const stored = mocks.createFile.mock.calls[0][2] as File
    expect(stored.name.endsWith('.mp3')).toBe(true)
    const row = mocks.createRow.mock.calls[0][0].data
    expect(row.originalName).toBe('Song.mp3')
    expect(row.size).toBe(stored.size)
    expect(row.size).not.toBe(fixture('damaged.mp3').byteLength)
  })

  it('does not bother a healthy file', async () => {
    setup()
    await expect(storeMusicFile(form(), skater)).resolves.toBeDefined()
  })
})
