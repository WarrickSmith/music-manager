import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFakeState,
  createFakeStorage,
  createFakeTablesDB,
  createFakeTeams,
  type FakeState,
} from './fake-appwrite'

let state: FakeState

vi.mock('node-appwrite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node-appwrite')>()
  return {
    ...actual,
    TablesDB: vi.fn(function () {
      return createFakeTablesDB(state)
    }),
    Storage: vi.fn(function () {
      return createFakeStorage(state)
    }),
    Teams: vi.fn(function () {
      return createFakeTeams(state)
    }),
  }
})

const { setupAppwrite, getTableDefinitions, getIndexDefinitions } =
  await import('../scripts/setup-appwrite')

const env = {
  APPWRITE_ENDPOINT: 'https://appwrite.test/v1',
  APPWRITE_PROJECT_ID: 'test-project',
  APPWRITE_API_KEY: 'test-key',
  APPWRITE_DATABASE_ID: 'MusicManagerDB',
  APPWRITE_BUCKET_ID: 'mmfiles',
  APPWRITE_COMPETITIONS_COLLECTION_ID: 'competitions',
  APPWRITE_GRADES_COLLECTION_ID: 'grades',
  APPWRITE_MUSIC_FILES_COLLECTION_ID: 'musicfiles',
}

// Run setup while letting the column polling timers fire instantly
async function runSetup(options?: Parameters<typeof setupAppwrite>[0]) {
  const promise = setupAppwrite(options)
  await vi.runAllTimersAsync()
  return promise
}

beforeEach(() => {
  state = createFakeState()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('setupAppwrite', () => {
  it('creates every resource on an empty project', async () => {
    const result = await runSetup({ all: true })

    expect(result.errors).toBeUndefined()
    expect(result.success).toBe(true)
    expect(state.databases.has('MusicManagerDB')).toBe(true)
    expect(state.buckets.has('mmfiles')).toBe(true)
    expect(state.teams.map((team) => team.$id)).toEqual(['admin', 'competitor'])

    for (const table of getTableDefinitions()) {
      const created = state.tables.get(`MusicManagerDB/${table.id}`)
      expect(created, table.id).toBeDefined()
      expect([...created!.columns.keys()]).toEqual(
        table.columns.map((column) => column.key)
      )
      expect(created!.permissions).toEqual(table.permissions)
    }

    for (const [tableId, indexes] of Object.entries(getIndexDefinitions())) {
      const table = state.tables.get(`MusicManagerDB/${tableId}`)!
      expect([...table.indexes.keys()]).toEqual(indexes.map((i) => i.key))
    }
  })

  it('creates the storage bucket private, with no read access for anyone', async () => {
    await runSetup({ all: true })
    expect(state.bucketPermissions.get('mmfiles')).toEqual([])
  })

  it('closes a bucket that an earlier version left open to the public', async () => {
    state.buckets.add('mmfiles')
    state.bucketPermissions.set('mmfiles', [
      'read("any")',
      'read("team:admin")',
    ])

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    expect(state.bucketPermissions.get('mmfiles')).toEqual([])
    expect(result.results).toContain("Made storage bucket 'mmfiles' private")
  })

  it('uses varchar columns instead of the deprecated string type', async () => {
    await runSetup({ all: true })

    const types = new Set(
      state.calls
        .filter((call) => call.startsWith('create:'))
        .map((call) => call.split(':')[1])
    )
    expect(types).toContain('varchar')
    expect(types).not.toContain('string')
  })

  it('waits for columns to finish building before creating indexes', async () => {
    state.columnBuildPolls = 3

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    const table = state.tables.get('MusicManagerDB/musicfiles')!
    expect(table.indexes.has('idx_file')).toBe(true)
  })

  it('is safe to run twice', async () => {
    await runSetup({ all: true })
    const createCallsBefore = state.calls.filter((c) =>
      c.startsWith('create')
    ).length

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    const createCallsAfter = state.calls.filter((c) =>
      c.startsWith('create')
    ).length
    expect(createCallsAfter).toBe(createCallsBefore)
    expect(result.results).toContain(
      "Table 'competitions' already exists, checking columns..."
    )
  })

  it('adds missing columns to an existing table', async () => {
    await runSetup({ all: true })
    state.tables
      .get('MusicManagerDB/competitions')!
      .columns.delete('description')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    expect(result.results).toContain(
      "Created string column 'description' in table 'competitions'"
    )
  })

  it('upgrades a project set up before deadlines and entries existed', async () => {
    await runSetup({ all: true })
    state.tables
      .get('MusicManagerDB/competitions')!
      .columns.delete('uploadDeadline')
    state.tables.delete('MusicManagerDB/entries')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    expect(result.results).toContain(
      "Created datetime column 'uploadDeadline' in table 'competitions'"
    )
    const entries = state.tables.get('MusicManagerDB/entries')!
    expect([...entries.columns.keys()]).toEqual([
      'competitionId',
      'gradeId',
      'userId',
      'userName',
    ])
    expect(entries.indexes.get('idx_competition_grade_user')?.columns).toEqual([
      'competitionId',
      'gradeId',
      'userId',
    ])
  })

  it('reports a missing API key scope instead of treating tables as missing', async () => {
    state.databases.add('MusicManagerDB')
    state.missingScopes.add('tables.read')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(false)
    expect(state.calls.some((c) => c.startsWith('createTable'))).toBe(false)
    expect(result.errors).toHaveLength(4)
    for (const error of result.errors!) {
      expect(error).toContain('missing scopes (["tables.read"])')
      expect(error).toContain('APPWRITE_API_KEY has the required scopes')
    }
  })

  it('reports columns that fail to build', async () => {
    state.failingColumns.add('fileId')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(false)
    expect(result.errors?.join('\n')).toContain(
      "Columns failed to build in table 'musicfiles': fileId (Simulated build failure)"
    )
  })

  it('skips tables and indexes when the database cannot be set up', async () => {
    state.missingScopes.add('databases.read')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(false)
    expect(state.calls.some((c) => c.startsWith('getTable'))).toBe(false)
    expect(state.calls.some((c) => c.startsWith('createIndex'))).toBe(false)
  })

  it('fails fast when required environment variables are missing', async () => {
    vi.stubEnv('APPWRITE_API_KEY', '')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([
      'Missing required environment variables: APPWRITE_API_KEY',
    ])
    expect(state.calls).toEqual([])
  })

  it('uses table IDs from the environment', async () => {
    vi.stubEnv('APPWRITE_GRADES_COLLECTION_ID', 'custom-grades')

    const result = await runSetup({ all: true })

    expect(result.success).toBe(true)
    expect(state.tables.has('MusicManagerDB/custom-grades')).toBe(true)
    expect(state.tables.has('MusicManagerDB/grades')).toBe(false)
  })
})
