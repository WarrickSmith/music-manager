import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFakeState,
  createFakeStorage,
  createFakeTablesDB,
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

function createAllResources() {
  state.databases.add('MusicManagerDB')
  state.buckets.add('mmfiles')
  for (const tableId of ['competitions', 'grades', 'musicfiles']) {
    state.tables.set(`MusicManagerDB/${tableId}`, {
      name: tableId,
      permissions: [],
      columns: new Map(),
      indexes: new Map(),
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
    expect(status.errors).toHaveLength(3)
    expect(status.errors[0]).toContain('missing scopes (["tables.read"])')
  })
})

describe('initializeAppwrite', () => {
  it('returns success when setup succeeds', async () => {
    setupAppwrite.mockResolvedValue({ success: true, results: ['done'] })

    await expect(initializeAppwrite()).resolves.toEqual({
      success: true,
      message: 'Appwrite resources initialized successfully',
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
    })
  })

  it('returns an error when setup throws', async () => {
    setupAppwrite.mockRejectedValue(new Error('network down'))

    const result = await initializeAppwrite()

    expect(result.success).toBe(false)
    expect(result.errors).toEqual(['network down'])
  })
})
