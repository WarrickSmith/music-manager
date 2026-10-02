import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  session: null as null | { $id: string; labels: string[] },
  getRow: vi.fn(),
  updateRow: vi.fn(),
  createRow: vi.fn(),
  deleteRow: vi.fn(),
  listRows: vi.fn(),
  deleteFile: vi.fn(),
  usersList: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/appwrite/initialization-service', () => ({
  checkAppwriteInitialization: async () => ({ isInitialized: true }),
}))
vi.mock('@/lib/appwrite/default-grades', () => ({ defaultGrades: [] }))
vi.mock('@/lib/auth/guards', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/guards')>(
      '@/lib/auth/guards'
    )
  return {
    ...actual,
    getSessionUser: async () => m.session,
    getAdminUser: async () =>
      m.session && m.session.labels.includes('admin') ? m.session : null,
  }
})
vi.mock('@/lib/appwrite/server', () => ({
  tablesDB: {
    getRow: m.getRow,
    updateRow: m.updateRow,
    createRow: m.createRow,
    deleteRow: m.deleteRow,
    listRows: m.listRows,
  },
  storage: { deleteFile: m.deleteFile },
  users: { list: m.usersList },
  ID: { unique: () => 'new-id' },
  Query: {
    equal: (k: string, v: unknown) => `equal(${k},${JSON.stringify(v)})`,
    limit: (n: number) => `limit(${n})`,
    offset: (n: number) => `offset(${n})`,
    orderDesc: (k: string) => `orderDesc(${k})`,
    orderAsc: (k: string) => `orderAsc(${k})`,
  },
}))
vi.mock('music-metadata', () => ({ parseBuffer: vi.fn() }))

vi.stubEnv('APPWRITE_DATABASE_ID', 'db')
vi.stubEnv('APPWRITE_BUCKET_ID', 'bucket')
vi.stubEnv('APPWRITE_COMPETITIONS_COLLECTION_ID', 'competitions')
vi.stubEnv('APPWRITE_GRADES_COLLECTION_ID', 'grades')
vi.stubEnv('APPWRITE_MUSIC_FILES_COLLECTION_ID', 'musicfiles')

const { updateCompetitionDeadline, getCompetitionDeadlines } =
  await import('@/app/actions/competition-actions')
const { deleteMusicFile, findExistingMusicFile } =
  await import('@/app/actions/music-file-actions')
const entries = await import('@/app/actions/entry-actions')

const admin = { $id: 'admin1', labels: ['admin'] }
const mia = { $id: 'u1', labels: ['competitor'] }
const FUTURE = new Date(Date.now() + 7 * 864e5).toISOString()
const PAST = new Date(Date.now() - 864e5).toISOString()

beforeEach(() => {
  vi.clearAllMocks()
  m.session = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('updateCompetitionDeadline', () => {
  it('is for admins only', async () => {
    m.session = mia
    expect(await updateCompetitionDeadline('c1', FUTURE)).toEqual({
      ok: false,
      error: 'Only admins can do this.',
    })
    m.session = null
    expect((await updateCompetitionDeadline('c1', FUTURE)).ok).toBe(false)
    expect(m.updateRow).not.toHaveBeenCalled()
  })

  it('saves and clears a deadline', async () => {
    m.session = admin
    m.updateRow.mockResolvedValue({})
    expect(await updateCompetitionDeadline('c1', FUTURE)).toEqual({
      ok: true,
      data: { uploadDeadline: FUTURE },
    })
    expect(m.updateRow.mock.calls[0][0].data).toEqual({
      uploadDeadline: FUTURE,
    })
    await updateCompetitionDeadline('c1', null)
    expect(m.updateRow.mock.calls[1][0].data).toEqual({ uploadDeadline: null })
  })

  it('rejects a date that is not a date', async () => {
    m.session = admin
    const result = await updateCompetitionDeadline('c1', 'soon')
    expect(result.ok).toBe(false)
    expect(m.updateRow).not.toHaveBeenCalled()
  })

  it('tells the admin to run setup when the column is missing', async () => {
    m.session = admin
    m.updateRow.mockRejectedValue(
      new Error(
        'Invalid document structure: Unknown attribute: "uploadDeadline"'
      )
    )
    const result = await updateCompetitionDeadline('c1', FUTURE)
    expect(result).toMatchObject({ ok: false })
    expect((result as { error: string }).error).toContain('run setup')
  })
})

describe('getCompetitionDeadlines', () => {
  it('maps only the competitions that have a deadline', async () => {
    m.listRows.mockResolvedValue({
      rows: [
        { $id: 'c1', uploadDeadline: FUTURE },
        { $id: 'c2' },
        { $id: 'c3', uploadDeadline: null },
      ],
    })
    expect(await getCompetitionDeadlines()).toEqual({ c1: FUTURE })
  })
})

describe('deleteMusicFile and the deadline', () => {
  const setup = (deadline?: string) => {
    m.getRow.mockImplementation(async ({ tableId }: { tableId: string }) =>
      tableId === 'competitions'
        ? { $id: 'c1', name: 'Winter Cup', uploadDeadline: deadline }
        : { $id: 'row1', competitionId: 'c1' }
    )
    m.deleteFile.mockResolvedValue({})
    m.deleteRow.mockResolvedValue({})
  }

  it('locks a competitor out after the deadline and deletes nothing', async () => {
    m.session = mia
    setup(PAST)
    const result = await deleteMusicFile('file1', 'row1')
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toContain('locked')
    expect(m.deleteFile).not.toHaveBeenCalled()
    expect(m.deleteRow).not.toHaveBeenCalled()
  })

  it('lets a competitor delete before the deadline or when there is none', async () => {
    m.session = mia
    setup(FUTURE)
    expect(await deleteMusicFile('file1', 'row1')).toEqual({ success: true })
    setup(undefined)
    expect(await deleteMusicFile('file1', 'row1')).toEqual({ success: true })
  })

  it('lets an admin delete after the deadline', async () => {
    m.session = admin
    setup(PAST)
    expect(await deleteMusicFile('file1', 'row1')).toEqual({ success: true })
    expect(m.deleteFile).toHaveBeenCalledWith('bucket', 'file1')
  })
})

describe('findExistingMusicFile', () => {
  it('returns null when there is none, or a summary when there is', async () => {
    m.listRows.mockResolvedValueOnce({ rows: [] })
    expect(await findExistingMusicFile('u1', 'g1')).toEqual({
      ok: true,
      data: null,
    })
    m.listRows.mockResolvedValueOnce({
      rows: [{ $id: 'r1', originalName: 'a.mp3', uploadedAt: 'x', size: 5 }],
    })
    expect(await findExistingMusicFile('u1', 'g1')).toEqual({
      ok: true,
      data: {
        id: 'r1',
        originalName: 'a.mp3',
        uploadedAt: 'x',
        size: 5,
        duration: null,
      },
    })
  })
})

describe('entry actions: admin only', () => {
  it('refuses everyone but admins', async () => {
    m.session = mia
    const denied = { ok: false, error: 'Only admins can do this.' }
    expect(await entries.getEntryOverview('c1')).toEqual(denied)
    expect(
      await entries.addEntries({
        competitionId: 'c1',
        userId: 'u1',
        userName: 'M',
        gradeIds: ['g1'],
      })
    ).toEqual(denied)
    expect(await entries.removeEntry('e1')).toEqual(denied)
    expect(await entries.listCompetitors()).toEqual(denied)
    expect(m.createRow).not.toHaveBeenCalled()
    expect(m.deleteRow).not.toHaveBeenCalled()
  })
})

describe('addEntries', () => {
  const input = {
    competitionId: 'c1',
    userId: 'u1',
    userName: 'Mia',
    gradeIds: ['g1', 'g2', 'g2', 'g3'],
  }

  it('counts added and already-entered grades, ignoring repeats', async () => {
    m.session = admin
    m.createRow
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('exists'), { code: 409 }))
      .mockResolvedValueOnce({})
    expect(await entries.addEntries(input)).toEqual({
      ok: true,
      data: { added: 2, skipped: 1 },
    })
    expect(m.createRow).toHaveBeenCalledTimes(3)
  })

  it('needs a skater and at least one grade', async () => {
    m.session = admin
    expect((await entries.addEntries({ ...input, gradeIds: [] })).ok).toBe(
      false
    )
    expect((await entries.addEntries({ ...input, userId: '' })).ok).toBe(false)
  })

  it('explains a missing entries table', async () => {
    m.session = admin
    m.createRow.mockRejectedValue(
      Object.assign(
        new Error('Collection with the requested ID could not be found.'),
        { code: 404 }
      )
    )
    const result = await entries.addEntries(input)
    expect((result as { error: string }).error).toContain('run setup')
  })

  it('reports how far it got when it fails part-way', async () => {
    m.session = admin
    m.createRow
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('network down'))
    const result = await entries.addEntries(input)
    expect((result as { error: string }).error).toContain(
      '1 entries were added'
    )
  })
})

describe('getOutstandingMusic', () => {
  const rows = (table: string) => {
    switch (table) {
      case 'entries':
        return [
          { $id: 'e1', gradeId: 'g1', competitionId: 'c1' },
          { $id: 'e2', gradeId: 'g2', competitionId: 'c1' },
          { $id: 'e3', gradeId: 'g3', competitionId: 'c2' },
        ]
      case 'grades':
        return [
          {
            $id: 'g1',
            name: 'Singles',
            category: 'Junior',
            segment: 'Free Skate',
          },
          {
            $id: 'g2',
            name: 'Singles',
            category: 'Junior',
            segment: 'Short Program',
          },
          {
            $id: 'g3',
            name: 'Singles',
            category: 'Novice',
            segment: 'Free Skate',
          },
        ]
      case 'competitions':
        return [
          {
            $id: 'c1',
            name: 'Cup',
            year: 2026,
            active: true,
            uploadDeadline: FUTURE,
          },
          { $id: 'c2', name: 'Old', year: 2025, active: false },
        ]
      default:
        return [{ $id: 'f1', gradeId: 'g1' }]
    }
  }

  beforeEach(() => {
    m.listRows.mockImplementation(async ({ tableId }: { tableId: string }) => ({
      rows: rows(tableId),
    }))
  })

  it('only lets skaters see their own entries', async () => {
    m.session = mia
    expect((await entries.getOutstandingMusic('someone-else')).ok).toBe(false)
    m.session = null
    expect((await entries.getOutstandingMusic('u1')).ok).toBe(false)
  })

  it('lists entries without music in active competitions only', async () => {
    m.session = mia
    const result = await entries.getOutstandingMusic('u1')
    expect(result.ok && result.data.map((o) => o.entryId)).toEqual(['e2'])
    expect(result.ok && result.data[0]).toMatchObject({
      competitionName: 'Cup',
      gradeSegment: 'Short Program',
      uploadDeadline: FUTURE,
    })
  })

  it('shows nothing, quietly, when entries have not been set up', async () => {
    m.session = mia
    m.listRows.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 404 })
    )
    expect(await entries.getOutstandingMusic('u1')).toEqual({
      ok: true,
      data: [],
    })
  })
})

describe('listCompetitors', () => {
  it('lists non-admin accounts, A to Z, across pages', async () => {
    m.session = admin
    const page = (n: number, start: number) =>
      Array.from({ length: n }, (_, i) => ({
        $id: `u${start + i}`,
        name: `Skater ${String(start + i).padStart(3, '0')}`,
        email: `s${start + i}@x.com`,
        labels: [],
      }))
    m.usersList
      .mockResolvedValueOnce({
        users: [
          ...page(99, 1),
          { $id: 'a', name: 'Boss', email: 'b@x', labels: ['admin'] },
        ],
      })
      .mockResolvedValueOnce({ users: page(2, 100) })
    const result = await entries.listCompetitors()
    expect(result.ok && result.data).toHaveLength(101)
    expect(result.ok && result.data.some((c) => c.id === 'a')).toBe(false)
    expect(m.usersList).toHaveBeenCalledTimes(2)
  })
})
