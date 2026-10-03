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
vi.mock('music-metadata', () => ({ parseBuffer: vi.fn() }))

vi.stubEnv('APPWRITE_DATABASE_ID', 'db')
vi.stubEnv('APPWRITE_BUCKET_ID', 'bucket')
vi.stubEnv('APPWRITE_MUSIC_FILES_COLLECTION_ID', 'musicfiles')
vi.stubEnv('APPWRITE_COMPETITIONS_COLLECTION_ID', 'competitions')
vi.stubEnv('APPWRITE_GRADES_COLLECTION_ID', 'grades')

const {
  storeMusicFile,
  UploadConflictError,
  UploadDeadlineError,
  UploadValidationError,
} = await import('@/lib/music/upload-service')

const FUTURE = new Date(Date.now() + 7 * 864e5).toISOString()
const PAST = new Date(Date.now() - 864e5).toISOString()

function form(extra: Record<string, string> = {}, file?: File) {
  const data = new FormData()
  data.set(
    'file',
    file ?? new File(['abc'], 'swan.mp3', { type: 'audio/mpeg' })
  )
  data.set('competitionId', 'c1')
  data.set('gradeId', 'g1')
  data.set('userId', 'u1')
  data.set('userName', 'Mia Kowalski')
  data.set('duration', '212')
  for (const [k, v] of Object.entries(extra)) data.set(k, v)
  return data
}

function setup(opts: { deadline?: string; existing?: object[] } = {}) {
  mocks.getRow.mockImplementation(async ({ tableId }: { tableId: string }) =>
    tableId === 'competitions'
      ? { name: 'Winter Cup', year: 2026, uploadDeadline: opts.deadline }
      : { name: 'Singles', category: 'Junior Girls', segment: 'Free Skate' }
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
    await expect(storeMusicFile(form({ gradeId: '' }))).rejects.toBeInstanceOf(
      UploadValidationError
    )
    await expect(
      storeMusicFile(form({}, new File(['x'], 'a.txt', { type: 'text/plain' })))
    ).rejects.toThrow('Invalid file type')
    const big = new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'big.mp3', {
      type: 'audio/mpeg',
    })
    await expect(storeMusicFile(form({}, big))).rejects.toThrow('15MB')
    expect(mocks.createFile).not.toHaveBeenCalled()
  })
})

describe('storeMusicFile: deadline', () => {
  it('stops a competitor after the deadline and stores nothing', async () => {
    setup({ deadline: PAST })
    await expect(storeMusicFile(form())).rejects.toBeInstanceOf(
      UploadDeadlineError
    )
    expect(mocks.createFile).not.toHaveBeenCalled()
  })

  it('lets a competitor upload before the deadline', async () => {
    setup({ deadline: FUTURE })
    await expect(storeMusicFile(form())).resolves.toBeDefined()
  })

  it('lets an admin upload after the deadline', async () => {
    setup({ deadline: PAST })
    await expect(
      storeMusicFile(form(), { isAdmin: true })
    ).resolves.toBeDefined()
  })

  it('treats a competition with no deadline as always open', async () => {
    setup()
    await expect(storeMusicFile(form())).resolves.toBeDefined()
  })

  it('checks the deadline before looking for an existing file', async () => {
    setup({ deadline: PAST, existing: [oldRow] })
    await expect(storeMusicFile(form())).rejects.toBeInstanceOf(
      UploadDeadlineError
    )
  })
})

describe('storeMusicFile: one file per grade', () => {
  it('refuses a second file unless it is a confirmed replace', async () => {
    setup({ existing: [oldRow] })
    const error = await storeMusicFile(form()).catch((e) => e)
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
    await storeMusicFile(form())
    const queries = mocks.listRows.mock.calls[0][0].queries
    expect(queries).toContain('equal(userId,u1)')
    expect(queries).toContain('equal(gradeId,g1)')
  })

  it('stores the new file first and only then removes the old one', async () => {
    setup({ existing: [oldRow] })
    await storeMusicFile(form({ replace: 'true' }))
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
    await expect(storeMusicFile(form({ replace: 'true' }))).rejects.toThrow(
      'storage down'
    )
    expect(mocks.deleteFile).not.toHaveBeenCalled()
    expect(mocks.deleteRow).not.toHaveBeenCalled()
  })

  it('still succeeds if the old file cannot be removed afterwards', async () => {
    setup({ existing: [oldRow] })
    mocks.deleteFile.mockRejectedValueOnce(new Error('already gone'))
    await expect(
      storeMusicFile(form({ replace: 'true' }))
    ).resolves.toBeDefined()
    expect(mocks.deleteRow).toHaveBeenCalled()
  })

  it('does not delete anything for a first upload', async () => {
    setup()
    await storeMusicFile(form())
    expect(mocks.deleteFile).not.toHaveBeenCalled()
    expect(mocks.deleteRow).not.toHaveBeenCalled()
  })
})
