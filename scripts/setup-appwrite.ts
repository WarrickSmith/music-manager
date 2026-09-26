#!/usr/bin/env node
import {
  Client,
  TablesDB,
  Storage,
  Permission,
  Query,
  Role,
  Teams,
  TablesDBIndexType,
} from 'node-appwrite'

// Custom error type for better type safety
interface AppwriteError extends Error {
  code?: number
  type?: string
  response?: unknown
}

// Setup options interface
interface SetupOptions {
  database?: boolean
  tables?: boolean
  storage?: boolean
  indexes?: boolean
  teams?: boolean
  all?: boolean
}

// Setup result interface
interface SetupResult {
  success: boolean
  results: string[]
  errors?: string[]
}

// Column interface
export interface Column {
  key: string
  type: 'string' | 'integer' | 'boolean' | 'float' | 'datetime'
  size?: number
  required: boolean
  array?: boolean
  default?: string | number | boolean
}

// Table definition interface
export interface TableDefinition {
  id: string
  name: string
  permissions: string[]
  columns: Column[]
}

// Index definition interface
export interface IndexDefinition {
  key: string
  columns: string[]
  type: TablesDBIndexType
}

/**
 * Table IDs. The app reads these from the APPWRITE_*_COLLECTION_ID
 * environment variables, so setup uses the same values (falling back to the
 * historical defaults) to keep the two in sync.
 */
export function getTableIds() {
  return {
    competitions:
      process.env.APPWRITE_COMPETITIONS_COLLECTION_ID || 'competitions',
    grades: process.env.APPWRITE_GRADES_COLLECTION_ID || 'grades',
    musicFiles: process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID || 'musicfiles',
  }
}

// Table definitions
export function getTableDefinitions(): TableDefinition[] {
  const tableIds = getTableIds()

  return [
    {
      id: tableIds.competitions,
      name: 'Competitions Collection',
      permissions: [
        Permission.read(Role.team('admin')),
        Permission.read(Role.team('competitor')),
        Permission.write(Role.team('admin')),
        Permission.delete(Role.team('admin')),
      ],
      columns: [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'year', type: 'integer', required: true },
        { key: 'active', type: 'boolean', required: true },
        { key: 'description', type: 'string', size: 1000, required: false },
      ],
    },
    {
      id: tableIds.grades,
      name: 'Grades Collection',
      permissions: [
        Permission.read(Role.team('admin')),
        Permission.read(Role.team('competitor')),
        Permission.write(Role.team('admin')),
        Permission.delete(Role.team('admin')),
      ],
      columns: [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'category', type: 'string', size: 255, required: true },
        { key: 'segment', type: 'string', size: 255, required: true },
        { key: 'competitionId', type: 'string', size: 255, required: true },
        { key: 'isTemplate', type: 'boolean', required: false, default: false },
        { key: 'description', type: 'string', size: 1000, required: false },
      ],
    },
    {
      id: tableIds.musicFiles,
      name: 'Music Files Collection',
      permissions: [
        Permission.read(Role.team('admin')),
        Permission.read(Role.team('competitor')),
        Permission.write(Role.team('admin')),
        Permission.write(Role.team('competitor')),
        Permission.delete(Role.team('admin')),
        Permission.delete(Role.team('competitor')),
      ],
      columns: [
        { key: 'originalName', type: 'string', size: 255, required: true },
        { key: 'fileName', type: 'string', size: 255, required: true },
        { key: 'storagePath', type: 'string', size: 255, required: true },
        { key: 'competitionId', type: 'string', size: 255, required: true },
        { key: 'competitionName', type: 'string', size: 255, required: true },
        { key: 'competitionYear', type: 'integer', required: true },
        { key: 'gradeId', type: 'string', size: 255, required: true },
        { key: 'gradeType', type: 'string', size: 255, required: true },
        { key: 'gradeCategory', type: 'string', size: 255, required: true },
        { key: 'gradeSegment', type: 'string', size: 255, required: true },
        { key: 'userId', type: 'string', size: 255, required: true },
        { key: 'userName', type: 'string', size: 255, required: true },
        { key: 'uploadedAt', type: 'string', size: 255, required: true },
        { key: 'duration', type: 'integer', required: false },
        { key: 'size', type: 'integer', required: true },
        { key: 'status', type: 'string', size: 255, required: true },
        { key: 'fileId', type: 'string', size: 255, required: true },
      ],
    },
  ]
}

// Index definitions, keyed by table ID
export function getIndexDefinitions(): Record<string, IndexDefinition[]> {
  const tableIds = getTableIds()

  const key = (k: string, columns: string[]): IndexDefinition => ({
    key: k,
    columns,
    type: TablesDBIndexType.Key,
  })

  return {
    [tableIds.competitions]: [
      key('idx_active', ['active']),
      key('idx_year', ['year']),
    ],
    [tableIds.grades]: [
      key('idx_competition', ['competitionId']),
      key('idx_competition_template', ['competitionId', 'isTemplate']),
    ],
    [tableIds.musicFiles]: [
      key('idx_user', ['userId']),
      key('idx_competition', ['competitionId']),
      key('idx_grade', ['gradeId']),
      key('idx_competition_grade', ['competitionId', 'gradeId']),
      { key: 'idx_file', columns: ['fileId'], type: TablesDBIndexType.Unique },
    ],
  }
}

// Team definitions
const teams = [
  { id: 'admin', name: 'Administrators' },
  { id: 'competitor', name: 'Competitors' },
]

// How long to wait for Appwrite to finish building new columns
const COLUMN_WAIT_TIMEOUT_MS = 60_000
const COLUMN_POLL_INTERVAL_MS = 1_000

// Appwrite returns 25 items per page by default; tables here are far smaller
const LIST_ALL = [Query.limit(100)]

function isNotFound(error: unknown) {
  return (error as AppwriteError).code === 404
}

/**
 * Turn an Appwrite error into a message that says what to fix. A 401 here
 * almost always means the API key is missing a scope.
 */
export function describeAppwriteError(error: unknown): string {
  const appwriteError = error as AppwriteError
  const message = appwriteError?.message || String(error)

  if (
    appwriteError?.code === 401 ||
    appwriteError?.type === 'general_unauthorized_scope'
  ) {
    return `${message}. Check that APPWRITE_API_KEY has the required scopes (see docs/deployment-guide.md).`
  }

  return message
}

// Validate environment variables
function validateEnvironment(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_BUCKET_ID',
  ]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Initialize Appwrite client
function initializeClient(): {
  client: Client
  tablesDB: TablesDB
  storage: Storage
  teams: Teams
} {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    console.error('Missing required Appwrite environment variables')
    throw new Error(
      'Appwrite configuration incomplete. Check your environment variables.'
    )
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey)

  return {
    client,
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    teams: new Teams(client),
  }
}

// Setup database
async function setupDatabase(
  { tablesDB }: { tablesDB: TablesDB },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID!

    try {
      await tablesDB.get({ databaseId })
      results.push(`Database '${databaseId}' already exists`)
    } catch (error: unknown) {
      if (!isNotFound(error)) {
        throw error
      }
      await tablesDB.create({ databaseId, name: 'Music Manager Database' })
      results.push(`Created database '${databaseId}'`)
    }

    return true
  } catch (error: unknown) {
    const message = `Error setting up database: ${describeAppwriteError(error)}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// Setup tables
async function setupTables(
  { tablesDB }: { tablesDB: TablesDB },
  results: string[],
  errors: string[]
): Promise<boolean> {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  let success = true

  for (const table of getTableDefinitions()) {
    try {
      try {
        await tablesDB.getTable({ databaseId, tableId: table.id })
        results.push(`Table '${table.id}' already exists, checking columns...`)
      } catch (error: unknown) {
        if (!isNotFound(error)) {
          throw error
        }
        await tablesDB.createTable({
          databaseId,
          tableId: table.id,
          name: table.name,
          permissions: table.permissions,
        })
        results.push(`Created table '${table.id}'`)
      }

      await ensureColumns(
        tablesDB,
        databaseId,
        table.id,
        table.columns,
        results
      )
    } catch (error: unknown) {
      const message = `Error setting up table '${table.id}': ${describeAppwriteError(error)}`
      errors.push(message)
      console.error(message, error)
      success = false
    }
  }

  return success
}

// Create a single column using the TablesDB API
async function createColumn(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
  column: Column
) {
  const base = {
    databaseId,
    tableId,
    key: column.key,
    required: column.required,
    array: column.array,
  }

  switch (column.type) {
    case 'string':
      return tablesDB.createVarcharColumn({
        ...base,
        size: column.size || 255,
        xdefault: column.default as string | undefined,
      })
    case 'integer':
      return tablesDB.createIntegerColumn({
        ...base,
        xdefault: column.default as number | undefined,
      })
    case 'boolean':
      return tablesDB.createBooleanColumn({
        ...base,
        xdefault: column.default as boolean | undefined,
      })
    case 'float':
      return tablesDB.createFloatColumn({
        ...base,
        xdefault: column.default as number | undefined,
      })
    case 'datetime':
      return tablesDB.createDatetimeColumn({
        ...base,
        xdefault: column.default as string | undefined,
      })
  }
}

// Ensure columns exist on a table and are ready to use
async function ensureColumns(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
  columns: Column[],
  results: string[]
): Promise<void> {
  const response = await tablesDB.listColumns({
    databaseId,
    tableId,
    queries: LIST_ALL,
  })
  const existingKeys = new Set(response.columns.map((column) => column.key))

  for (const column of columns) {
    if (existingKeys.has(column.key)) {
      continue
    }

    try {
      await createColumn(tablesDB, databaseId, tableId, column)
      results.push(
        `Created ${column.type} column '${column.key}' in table '${tableId}'`
      )
    } catch (error: unknown) {
      // If the column is already being created, continue
      if ((error as AppwriteError).code === 409) {
        results.push(
          `Column '${column.key}' is already being created in table '${tableId}'`
        )
      } else {
        throw error
      }
    }
  }

  await waitForColumns(tablesDB, databaseId, tableId)
}

/**
 * Appwrite builds columns in the background. Wait until none are still
 * processing so indexes and writes that depend on them don't fail.
 */
async function waitForColumns(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string
): Promise<void> {
  const deadline = Date.now() + COLUMN_WAIT_TIMEOUT_MS

  while (true) {
    const { columns } = await tablesDB.listColumns({
      databaseId,
      tableId,
      queries: LIST_ALL,
    })

    const failed = columns.filter(
      (column) => column.status === 'failed' || column.status === 'stuck'
    )
    if (failed.length > 0) {
      throw new Error(
        `Columns failed to build in table '${tableId}': ${failed
          .map((column) => `${column.key} (${column.error || column.status})`)
          .join(', ')}`
      )
    }

    if (columns.every((column) => column.status === 'available')) {
      return
    }

    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for columns to become available in table '${tableId}'`
      )
    }

    await new Promise((resolve) => setTimeout(resolve, COLUMN_POLL_INTERVAL_MS))
  }
}

// Setup indexes
async function setupIndexes(
  { tablesDB }: { tablesDB: TablesDB },
  results: string[],
  errors: string[]
): Promise<boolean> {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  let success = true

  for (const [tableId, indexes] of Object.entries(getIndexDefinitions())) {
    try {
      const response = await tablesDB.listIndexes({
        databaseId,
        tableId,
        queries: LIST_ALL,
      })
      const existingKeys = new Set(response.indexes.map((index) => index.key))

      for (const index of indexes) {
        if (existingKeys.has(index.key)) {
          results.push(
            `Index '${index.key}' already exists on table '${tableId}'`
          )
          continue
        }

        try {
          await tablesDB.createIndex({
            databaseId,
            tableId,
            key: index.key,
            type: index.type,
            columns: index.columns,
          })
          results.push(`Created index '${index.key}' on table '${tableId}'`)
        } catch (error: unknown) {
          if ((error as AppwriteError).code === 409) {
            results.push(
              `Index '${index.key}' already exists on table '${tableId}'`
            )
          } else {
            throw error
          }
        }
      }
    } catch (error: unknown) {
      const message = `Error setting up indexes for table '${tableId}': ${describeAppwriteError(error)}`
      errors.push(message)
      console.error(message, error)
      success = false
    }
  }

  return success
}

// Setup storage
async function setupStorage(
  { storage }: { storage: Storage },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    const bucketId = process.env.APPWRITE_BUCKET_ID!
    try {
      await storage.getBucket(bucketId)
      results.push(`Storage bucket '${bucketId}' already exists`)

      // Update existing bucket permissions to include public read access
      await storage.updateBucket(
        bucketId,
        'Music Manager Files',
        [
          Permission.read(Role.any()), // Allow public read access for streaming
          Permission.read(Role.team('admin')),
          Permission.read(Role.team('competitor')),
          Permission.write(Role.team('admin')),
          Permission.write(Role.team('competitor')),
          Permission.delete(Role.team('admin')),
          Permission.delete(Role.team('competitor')),
        ],
        true // fileSecurity
      )
      results.push(
        `Updated storage bucket '${bucketId}' with public read permissions`
      )
    } catch (error: unknown) {
      const appwriteError = error as AppwriteError
      if (appwriteError.code === 404) {
        // Create bucket with public read permissions
        await storage.createBucket(
          bucketId,
          'Music Manager Files',
          [
            Permission.read(Role.any()), // Allow public read access for streaming
            Permission.read(Role.team('admin')),
            Permission.read(Role.team('competitor')),
            Permission.write(Role.team('admin')),
            Permission.write(Role.team('competitor')),
            Permission.delete(Role.team('admin')),
            Permission.delete(Role.team('competitor')),
          ],
          true // fileSecurity
        )
        results.push(
          `Created storage bucket '${bucketId}' with public read permissions`
        )
      } else {
        throw error
      }
    }
    return true
  } catch (error: unknown) {
    const message = `Error setting up storage: ${describeAppwriteError(error)}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// Setup teams
async function setupTeams(
  { teams: teamsService }: { teams: Teams },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    // Create required teams
    for (const team of teams) {
      try {
        // Check if team exists
        try {
          const existingTeams = await teamsService.list()
          const existingTeam = existingTeams.teams.find(
            (t) => t.name.toLowerCase() === team.name.toLowerCase()
          )

          if (existingTeam) {
            results.push(`Team '${team.name}' already exists`)
            continue
          }
        } catch (error: unknown) {
          const appwriteError = error as AppwriteError
          // If error is not 404, throw it
          if (appwriteError.code !== 404) {
            throw error
          }
        }

        // Create team
        await teamsService.create(team.id, team.name)
        results.push(`Created team '${team.name}'`)
      } catch (error: unknown) {
        const appwriteError = error as AppwriteError
        // If team already exists, continue
        if (appwriteError.code === 409) {
          results.push(`Team '${team.name}' already exists`)
        } else {
          throw error
        }
      }
    }

    return true
  } catch (error: unknown) {
    const message = `Error setting up teams: ${describeAppwriteError(error)}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// Main setup function
export async function setupAppwrite(
  options?: SetupOptions
): Promise<SetupResult> {
  // Initialize result arrays
  const results: string[] = []
  const errors: string[] = []

  try {
    // Log start time
    const startTime = new Date()
    results.push(`Setup started at ${startTime.toISOString()}`)

    // Validate environment
    const envValidation = validateEnvironment()
    if (!envValidation.valid) {
      throw new Error(
        `Missing required environment variables: ${envValidation.missing.join(
          ', '
        )}`
      )
    }

    // Initialize client
    const { tablesDB, storage, teams } = initializeClient()

    // If no options provided or options.all is true, run all setup steps
    if (!options || options.all) {
      options = {
        database: true,
        tables: true,
        storage: true,
        indexes: true,
        teams: true,
      }
    }

    // Execute setup steps based on options
    let databaseReady = true
    if (options.database) {
      databaseReady = await setupDatabase({ tablesDB }, results, errors)
    }

    let tablesReady = databaseReady
    if (options.tables && databaseReady) {
      tablesReady = await setupTables({ tablesDB }, results, errors)
    }

    if (options.storage) {
      await setupStorage({ storage }, results, errors)
    }

    if (options.teams) {
      await setupTeams({ teams }, results, errors)
    }

    // Indexes depend on the tables and their columns
    if (options.indexes && tablesReady) {
      await setupIndexes({ tablesDB }, results, errors)
    }

    // Log end time and duration
    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000
    results.push(
      `Setup completed at ${endTime.toISOString()} (duration: ${duration.toFixed(
        2
      )}s)`
    )

    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: unknown) {
    console.error('Fatal error in setup process:', error)
    return {
      success: false,
      results,
      errors: [...errors, describeAppwriteError(error)],
    }
  }
}

// If run as a script, execute setup
if (typeof require !== 'undefined' && require.main === module) {
  void (async () => {
    const dotenv = await import('dotenv')
    dotenv.config({ path: ['.env.local', '.env'] })

    // Parse command line arguments
    const args = process.argv.slice(2)
    const options: SetupOptions = {}

    if (args.includes('--all')) options.all = true
    if (args.includes('--database')) options.database = true
    // --collections is kept as an alias for existing scripts and habits
    if (args.includes('--tables') || args.includes('--collections'))
      options.tables = true
    if (args.includes('--storage')) options.storage = true
    if (args.includes('--indexes')) options.indexes = true
    if (args.includes('--teams')) options.teams = true

    // If no specific options provided, run all
    if (Object.keys(options).length === 0) {
      options.all = true
    }

    const result = await setupAppwrite(options)

    console.log('\n=== SETUP RESULTS ===\n')
    result.results.forEach((message) => console.log(`- ${message}`))

    if (result.errors && result.errors.length > 0) {
      console.error('\n=== SETUP ERRORS ===\n')
      result.errors.forEach((error) => console.error(`- ${error}`))
      process.exit(1)
    }

    console.log('\nSetup completed successfully!')
  })().catch((error) => {
    console.error('Unhandled error during setup:', error)
    process.exit(1)
  })
}
