import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFakeState,
  createFakeStorage,
  createFakeTablesDB,
  createFakeTeams,
  type FakeState,
} from './fake-appwrite'

let state: FakeState
const setupAppwrite = vi.fn()

vi.mock('@/lib/appwrite/server', () => ({
  tablesDB: new Proxy(
    {},
    {
      get: (_target, prop) =>
        createFakeTablesDB(state)[
          prop as keyof ReturnType<typeof createFakeTablesDB>
        ],
    }
  ),
  Query: { limit: (n: number) => `limit(${n})` },
  teams: new Proxy(
    {},
    {
      get: (_target, prop) =>
        createFakeTeams(state)[prop as keyof ReturnType<typeof createFakeTeams>],
    }
  ),
  storage: new Proxy(
    {},
    {
      get: (_target, prop) =>
        createFakeStorage(state)[
          prop as keyof ReturnType<typeof createFakeStorage>
        ],
    }
  ),
}))

vi.mock('../scripts/setup-appwrite', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../scripts/setup-appwrite')>()
  return { ...actual, setupAppwrite }
})

vi.stubEnv('APPWRITE_DATABASE_ID', 'MusicManagerDB')
vi.stubEnv('APPWRITE_BUCKET_ID', 'mmfiles')

const { checkAppwriteInitialization, initializeAppwrite } =
  await import('@/lib/appwrite/initialization-service')
const { getIndexDefinitions, getTableDefinitions, getTeamDefinitions } =
  await import('../scripts/setup-appwrite')

function createAllResources() {
  state.databases.add('MusicManagerDB')
  state.buckets.add('mmfiles')
  for (const team of getTeamDefinitions()) {
    state.teams.push({ $id: team.id, name: team.name })
  }
  const indexes = getIndexDefinitions()
  for (const table of getTableDefinitions()) {
    state.tables.set(`MusicManagerDB/${table.id}`, {
      name: table.id,
      permissions: [],
      columns: new Map(
        table.columns.map((column) => [
          column.key,
          {
            key: column.key,
            type: column.type,
            required: column.required,
            status: 'available',
            error: '',
            pollsUntilAvailable: 0,
          },
        ])
      ),
      indexes: new Map(
        (indexes[table.id] ?? []).map((index) => [
          index.key,
          { key: index.key, type: String(index.type), columns: index.columns },
        ])
      ),
      rows: [],
    })
  }
}

beforeEach(() => {
  state = createFakeState()
  setupAppwrite.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('checkAppwriteInitialization', () => {
  it('reports initialized when every resource exists', async () => {
    createAllResources()

    const status = await checkAppwriteInitialization()

    expect(status.isInitialized).toBe(true)
    expect(status.errors).toEqual([])
    expect(Object.values(status.details).every(Boolean)).toBe(true)
  })

  it('reports missing resources without errors on an empty project', async () => {
    const status = await checkAppwriteInitialization()

    expect(status.isInitialized).toBe(false)
    expect(status.errors).toEqual([])
    expect(status.details).toEqual({
      databaseExists: false,
      musicFilesCollectionExists: false,
      competitionsCollectionExists: false,
      gradesCollectionExists: false,
      storageBucketExists: false,
    })
  })

  it('flags a missing grades table', async () => {
    createAllResources()
    state.tables.delete('MusicManagerDB/grades')

    const status = await checkAppwriteInitialization()

    expect(status.isInitialized).toBe(false)
    expect(status.details.gradesCollectionExists).toBe(false)
  })

  it('surfaces a missing API key scope instead of hiding it', async () => {
    createAllResources()
    state.missingScopes.add('tables.read')

    const status = await checkAppwriteInitialization()

    expect(status.isInitialized).toBe(false)
    expect(status.errors).toHaveLength(4)
    expect(status.errors[0]).toContain('missing scopes (["tables.read"])')
  })
})

describe('setup report', () => {
  it('lists every table, column, index, bucket and team as ready', async () => {
    createAllResources()

    const { report } = await checkAppwriteInitialization()

    expect(report.database).toMatchObject({ id: 'MusicManagerDB', state: 'ready' })
    expect(report.bucket).toMatchObject({ id: 'mmfiles', state: 'ready' })
    expect(report.teams.map((team) => team.state)).toEqual(['ready', 'ready'])
    expect(report.tables.map((table) => table.id)).toEqual([
      'competitions',
      'grades',
      'musicfiles',
      'entries',
    ])
    for (const table of report.tables) {
      expect(table.state).toBe('ready')
      expect(table.columns.length).toBeGreaterThan(0)
      expect(table.columns.every((c) => c.state === 'ready')).toBe(true)
      expect(table.indexes.every((i) => i.state === 'ready')).toBe(true)
    }
    const musicFiles = report.tables.find((t) => t.id === 'musicfiles')!
    expect(musicFiles.columns.find((c) => c.id === 'duration')?.detail).toBe(
      'integer, optional'
    )
  })

  it('marks a missing column and a missing team without raising errors', async () => {
    createAllResources()
    state.tables.get('MusicManagerDB/grades')!.columns.delete('segment')
    state.teams.pop()

    const { report, errors } = await checkAppwriteInitialization()

    const grades = report.tables.find((t) => t.id === 'grades')!
    expect(grades.state).toBe('missing')
    expect(grades.columns.find((c) => c.id === 'segment')?.state).toBe('missing')
    expect(grades.columns.find((c) => c.id === 'name')?.state).toBe('ready')
    expect(report.teams[1].state).toBe('missing')
    expect(errors).toEqual([])
  })

  it('reports a column that failed to build, with its reason', async () => {
    createAllResources()
    const column = state.tables.get('MusicManagerDB/musicfiles')!.columns.get('size')!
    column.status = 'failed'
    column.error = 'Simulated build failure'

    const { report } = await checkAppwriteInitialization()

    const musicFiles = report.tables.find((t) => t.id === 'musicfiles')!
    expect(musicFiles.state).toBe('error')
    expect(musicFiles.columns.find((c) => c.id === 'size')).toMatchObject({
      state: 'error',
      error: 'Simulated build failure',
    })
  })

  it('shows a column still building as building, not missing', async () => {
    createAllResources()
    const column = state.tables.get('MusicManagerDB/grades')!.columns.get('name')!
    column.status = 'processing'
    // The fake advances a processing column on every listing; keep it building
    column.pollsUntilAvailable = 5

    const { report } = await checkAppwriteInitialization()

    const grades = report.tables.find((t) => t.id === 'grades')!
    expect(grades.columns.find((c) => c.id === 'name')?.state).toBe('building')
    expect(grades.state).toBe('building')
  })

  it('carries a teams scope error into the report and the error list', async () => {
    createAllResources()
    state.missingScopes.add('teams.read')

    const { report, errors } = await checkAppwriteInitialization()

    expect(report.teams.every((team) => team.state === 'error')).toBe(true)
    expect(report.teams[0].error).toContain('teams.read')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('teams:')
  })

  it('suggests the databases that do exist when the configured one is missing', async () => {
    state.databases.add('some-other-db')

    const { report } = await checkAppwriteInitialization()

    expect(report.database.state).toBe('missing')
    expect(report.otherDatabases).toEqual([
      { id: 'some-other-db', name: 'some-other-db' },
    ])
    expect(report.config.databaseId).toBe('MusicManagerDB')
    expect(report.config.apiKeySet).toBe(false)
  })

  it('does not list other databases when the configured one exists', async () => {
    createAllResources()
    state.databases.add('some-other-db')

    const { report } = await checkAppwriteInitialization()

    expect(report.otherDatabases).toBeUndefined()
  })

  it('marks every expected item missing when the database is missing', async () => {
    const { report } = await checkAppwriteInitialization()

    expect(report.database.state).toBe('missing')
    expect(report.tables.every((t) => t.state === 'missing')).toBe(true)
    expect(report.tables[0].columns.every((c) => c.state === 'missing')).toBe(true)
  })
})

describe('initializeAppwrite', () => {
  it('returns success when setup succeeds', async () => {
    setupAppwrite.mockResolvedValue({ success: true, results: ['done'] })

    await expect(initializeAppwrite()).resolves.toEqual({
      success: true,
      message: 'Appwrite resources initialized successfully',
      log: ['done'],
    })
  })

  it('returns the setup errors instead of throwing', async () => {
    setupAppwrite.mockResolvedValue({
      success: false,
      results: [],
      errors: ['missing scopes (["tables.write"])'],
    })

    await expect(initializeAppwrite()).resolves.toEqual({
      success: false,
      message: 'Failed to initialize Appwrite resources',
      errors: ['missing scopes (["tables.write"])'],
      log: [],
    })
  })

  it('returns an error when setup throws', async () => {
    setupAppwrite.mockRejectedValue(new Error('network down'))

    const result = await initializeAppwrite()

    expect(result.success).toBe(false)
    expect(result.errors).toEqual(['network down'])
  })
})
