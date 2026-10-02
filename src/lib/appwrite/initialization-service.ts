'use server'

import { tablesDB, storage, teams, Query } from '@/lib/appwrite/server'
import {
  describeAppwriteError,
  getIndexDefinitions,
  getTableDefinitions,
  getTableIds,
  getTeamDefinitions,
  setupAppwrite,
  STORAGE_BUCKET_NAME,
} from '../../../scripts/setup-appwrite'
import type {
  InitializationResult,
  InitializationStatus,
  SetupConfig,
  SetupItem,
  SetupReport,
  SetupState,
  SetupTable,
} from '@/lib/appwrite/setup-types'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!

// Define an error interface for type checking inside catch blocks
interface AppwriteError {
  code?: number
  message?: string
}

const TABLE_PURPOSES: Record<string, string> = {
  competitions: 'Each competition, its year and whether uploads are open',
  grades: 'The categories and segments skaters can enter in a competition',
  musicfiles: 'One record for every uploaded music file',
}

function columnDetail(column: {
  type: string
  size?: number
  required: boolean
}) {
  const type = column.size ? `${column.type}(${column.size})` : column.type
  return `${type}, ${column.required ? 'required' : 'optional'}`
}

/** Look up an item and turn the outcome into a state, noting any real error */
async function lookup<T>(
  label: string,
  run: () => Promise<T>,
  errors: string[]
): Promise<{ state: SetupState; error?: string; value?: T }> {
  try {
    return { state: 'ready', value: await run() }
  } catch (err: unknown) {
    if ((err as AppwriteError).code === 404) return { state: 'missing' }
    const message = describeAppwriteError(err)
    console.error(`Error checking ${label}:`, err)
    errors.push(`${label}: ${message}`)
    return { state: 'error', error: message }
  }
}

/** Check every column and index of a table that exists */
async function checkTableContents(
  table: SetupTable,
  expected: ReturnType<typeof getTableDefinitions>[number] | undefined,
  errors: string[]
) {
  const expectedIndexes = getIndexDefinitions()[table.id] ?? []

  const columnsResult = await lookup(
    `${table.id} columns`,
    () =>
      tablesDB.listColumns({
        databaseId,
        tableId: table.id,
        queries: [Query.limit(100)],
      }),
    errors
  )
  const found = new Map(
    (columnsResult.value?.columns ?? []).map((c) => [c.key, c])
  )
  table.columns = (expected?.columns ?? []).map((column) => {
    const item: SetupItem = {
      id: column.key,
      label: column.key,
      detail: columnDetail(column),
      state: 'missing',
    }
    if (columnsResult.state === 'error') {
      return { ...item, state: 'error', error: columnsResult.error }
    }
    const existing = found.get(column.key)
    if (!existing) return item
    if (existing.status === 'failed' || existing.status === 'stuck') {
      return {
        ...item,
        state: 'error',
        error: existing.error || `Column is ${existing.status}`,
      }
    }
    return {
      ...item,
      state: existing.status === 'available' ? 'ready' : 'building',
    }
  })

  const indexesResult = await lookup(
    `${table.id} indexes`,
    () =>
      tablesDB.listIndexes({
        databaseId,
        tableId: table.id,
        queries: [Query.limit(100)],
      }),
    errors
  )
  const foundIndexes = new Map(
    (indexesResult.value?.indexes ?? []).map((i) => [i.key, i])
  )
  table.indexes = expectedIndexes.map((index) => {
    const item: SetupItem = {
      id: index.key,
      label: index.key,
      detail: `${index.type} on ${index.columns.join(', ')}`,
      state: 'missing',
    }
    if (indexesResult.state === 'error') {
      return { ...item, state: 'error', error: indexesResult.error }
    }
    const existing = foundIndexes.get(index.key) as
      | { status?: string; error?: string }
      | undefined
    if (!existing) return item
    if (existing.status === 'failed' || existing.status === 'stuck') {
      return {
        ...item,
        state: 'error',
        error: existing.error || `Index is ${existing.status}`,
      }
    }
    return {
      ...item,
      state:
        existing.status && existing.status !== 'available'
          ? 'building'
          : 'ready',
    }
  })
}

/** Roll an item's own state together with its children's */
function worst(...states: SetupState[]): SetupState {
  for (const state of ['error', 'missing', 'building'] as const) {
    if (states.includes(state)) return state
  }
  return 'ready'
}

/**
 * Check if Appwrite resources are properly initialized
 */
export async function checkAppwriteInitialization(): Promise<InitializationStatus> {
  try {
    const tableIds = getTableIds()
    const definitions = getTableDefinitions()
    const errors: string[] = []

    const databaseResult = await lookup(
      'database',
      () => tablesDB.get({ databaseId }),
      errors
    )
    const databaseExists = databaseResult.state === 'ready'
    // Tables that Appwrite confirmed exist, whatever shape their columns are in
    const foundTables = new Set<string>()

    // Only check tables if the database exists
    const tables: SetupTable[] = await Promise.all(
      definitions.map(async (definition) => {
        const table: SetupTable = {
          id: definition.id,
          label: definition.id,
          detail: `Name: ${definition.name}`,
          purpose: TABLE_PURPOSES[definition.id] ?? '',
          state: 'missing',
          columns: [],
          indexes: [],
        }
        if (!databaseExists) {
          // Still list what is expected, all marked missing or errored
          table.columns = definition.columns.map((c) => ({
            id: c.key,
            label: c.key,
            detail: columnDetail(c),
            state: databaseResult.state === 'error' ? 'error' : 'missing',
            error: databaseResult.error,
          }))
          table.indexes = (getIndexDefinitions()[definition.id] ?? []).map(
            (i) => ({
              id: i.key,
              label: i.key,
              detail: `${i.type} on ${i.columns.join(', ')}`,
              state: databaseResult.state === 'error' ? 'error' : 'missing',
              error: databaseResult.error,
            })
          )
          if (databaseResult.state === 'error') {
            table.state = 'error'
            table.error = databaseResult.error
          }
          return table
        }

        const result = await lookup(
          `${definition.id} table`,
          () => tablesDB.getTable({ databaseId, tableId: definition.id }),
          errors
        )
        table.state = result.state
        table.error = result.error
        if (result.state === 'ready') {
          foundTables.add(definition.id)
          await checkTableContents(table, definition, errors)
          table.state = worst(
            ...table.columns.map((c) => c.state),
            ...table.indexes.map((i) => i.state)
          )
        } else {
          table.columns = definition.columns.map((c) => ({
            id: c.key,
            label: c.key,
            detail: columnDetail(c),
            state: result.state,
            error: result.error,
          }))
          table.indexes = (getIndexDefinitions()[definition.id] ?? []).map(
            (i) => ({
              id: i.key,
              label: i.key,
              detail: `${i.type} on ${i.columns.join(', ')}`,
              state: result.state,
              error: result.error,
            })
          )
        }
        return table
      })
    )

    const bucketResult = await lookup(
      'storage bucket',
      () => storage.getBucket(bucketId),
      errors
    )
    const storageBucketExists = bucketResult.state === 'ready'

    const teamsResult = await lookup('teams', () => teams.list(), errors)
    const teamItems: SetupItem[] = getTeamDefinitions().map((team) => {
      const item: SetupItem = {
        id: team.id,
        label: team.name,
        detail: `Team ID: ${team.id}. Holds every ${team.id}.`,
        state: 'missing',
      }
      if (teamsResult.state === 'error') {
        return { ...item, state: 'error', error: teamsResult.error }
      }
      const exists = teamsResult.value?.teams.some(
        (t) => t.name.toLowerCase() === team.name.toLowerCase()
      )
      return { ...item, state: exists ? 'ready' : 'missing' }
    })

    // When the configured database is missing, list what the project does have
    // so a wrong DATABASE_ID is obvious ("did you mean mm-test?")
    let otherDatabases: SetupReport['otherDatabases']
    if (databaseResult.state === 'missing') {
      try {
        const { databases: found } = await tablesDB.list()
        otherDatabases = found.map((db) => ({
          id: db.$id,
          name: db.name,
        }))
      } catch {
        // Listing is only a hint; the missing database is already reported
      }
    }

    const config: SetupConfig = {
      endpoint: process.env.APPWRITE_ENDPOINT ?? '(not set)',
      projectId: process.env.APPWRITE_PROJECT_ID ?? '(not set)',
      databaseId: databaseId ?? '(not set)',
      bucketId: bucketId ?? '(not set)',
      tableIds,
      apiKeySet: Boolean(process.env.APPWRITE_API_KEY),
    }

    const report: SetupReport = {
      config,
      otherDatabases,
      database: {
        id: databaseId,
        label: databaseId,
        detail: 'Holds the competition, grade and music file tables',
        state: databaseResult.state,
        error: databaseResult.error,
      },
      tables,
      bucket: {
        id: bucketId,
        label: bucketId,
        detail: `${STORAGE_BUCKET_NAME}. Stores the uploaded audio files`,
        state: bucketResult.state,
        error: bucketResult.error,
      },
      teams: teamItems,
    }

    const musicFilesCollectionExists = foundTables.has(tableIds.musicFiles)
    const competitionsCollectionExists = foundTables.has(tableIds.competitions)
    const gradesCollectionExists = foundTables.has(tableIds.grades)

    const isInitialized =
      databaseExists &&
      musicFilesCollectionExists &&
      competitionsCollectionExists &&
      gradesCollectionExists &&
      storageBucketExists

    return {
      isInitialized,
      details: {
        databaseExists,
        musicFilesCollectionExists,
        competitionsCollectionExists,
        gradesCollectionExists,
        storageBucketExists,
      },
      errors,
      report,
    }
  } catch (error) {
    console.error('Error checking Appwrite initialization:', error)
    throw new Error('Failed to check Appwrite initialization status')
  }
}

/**
 * Initialize Appwrite resources inside the app runtime so the Docker image
 * only needs the traced standalone bundle.
 *
 * Returns the outcome rather than throwing, because Next.js hides thrown
 * server action messages in production builds.
 */
export async function initializeAppwrite(): Promise<InitializationResult> {
  try {
    console.log('Running Appwrite initialization...')
    const result = await setupAppwrite({ all: true })

    result.results.forEach((message) =>
      console.log('Appwrite initialization:', message)
    )

    if (!result.success) {
      const errors = result.errors?.length
        ? result.errors
        : ['Unknown setup failure']
      console.error('Error initializing Appwrite:', errors.join('; '))
      return {
        success: false,
        message: 'Failed to initialize Appwrite resources',
        errors,
        log: result.results,
      }
    }

    return {
      success: true,
      message: 'Appwrite resources initialized successfully',
      log: result.results,
    }
  } catch (error) {
    console.error('Error initializing Appwrite:', error)
    return {
      success: false,
      message: 'Failed to initialize Appwrite resources',
      errors: [describeAppwriteError(error)],
    }
  }
}
