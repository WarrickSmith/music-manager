#!/usr/bin/env node
import * as dotenv from 'dotenv'
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  Teams,
} from 'node-appwrite'

// Custom error type for better type safety
interface AppwriteError extends Error {
  code?: number
  response?: unknown
}

// Setup options interface
interface SetupOptions {
  database?: boolean
  collections?: boolean
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

// Attribute interface
interface Attribute {
  key: string
  type: 'string' | 'integer' | 'boolean' | 'float' | 'datetime'
  size?: number
  required: boolean
  array?: boolean
  default?: string | number | boolean
}

// Collection definition interface
interface CollectionDefinition {
  id: string
  name: string
  permissions: string[]
  attributes: Attribute[]
}

// Appwrite attribute response interface
interface AppwriteAttributeList {
  total: number
  attributes: {
    key: string
    type: string
    size?: number
    required: boolean
    array: boolean
    status: string
  }[]
}

// Index definition interface is commented out for now
/*
interface IndexDefinition {
  id: string
  attributes: string[]
  type: 'key' | 'fulltext' | 'unique'
}
*/

// Collection definitions
const collections: CollectionDefinition[] = [
  {
    id: 'competitions',
    name: 'Competitions Collection',
    permissions: [
      Permission.read(Role.team('admin')),
      Permission.read(Role.team('competitor')),
      Permission.write(Role.team('admin')),
      Permission.delete(Role.team('admin')),
    ],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'year', type: 'integer', required: true },
      { key: 'active', type: 'boolean', required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
    ],
  },
  {
    id: 'grades',
    name: 'Grades Collection',
    permissions: [
      Permission.read(Role.team('admin')),
      Permission.read(Role.team('competitor')),
      Permission.write(Role.team('admin')),
      Permission.delete(Role.team('admin')),
    ],
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'category', type: 'string', size: 255, required: true },
      { key: 'segment', type: 'string', size: 255, required: true },
      { key: 'competitionId', type: 'string', size: 255, required: true },
      { key: 'isTemplate', type: 'boolean', required: false, default: false },
      { key: 'description', type: 'string', size: 1000, required: false },
    ],
  },
  {
    id: 'musicfiles',
    name: 'Music Files Collection',
    permissions: [
      Permission.read(Role.team('admin')),
      Permission.read(Role.team('competitor')),
      Permission.write(Role.team('admin')),
      Permission.write(Role.team('competitor')),
      Permission.delete(Role.team('admin')),
      Permission.delete(Role.team('competitor')),
    ],
    attributes: [
      { key: 'originalName', type: 'string', size: 255, required: true },
      { key: 'fileName', type: 'string', size: 255, required: true },
      { key: 'storagePath', type: 'string', size: 255, required: true },
      // downloadURL attribute removed as it is now redundant
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

// Index definitions are commented out for now as they're not being used
/*
const indexes: Record<string, IndexDefinition[]> = {
  competitions: [
    { id: 'idx_active', attributes: ['active'], type: 'key' },
    { id: 'idx_year', attributes: ['year'], type: 'key' },
  ],
  grades: [
    { id: 'idx_competition', attributes: ['competitionId'], type: 'key' },
    {
      id: 'idx_competition_template',
      attributes: ['competitionId', 'isTemplate'],
      type: 'key',
    },
  ],
  musicfiles: [
    { id: 'idx_user', attributes: ['userId'], type: 'key' },
    { id: 'idx_competition', attributes: ['competitionId'], type: 'key' },
    { id: 'idx_grade', attributes: ['gradeId'], type: 'key' },
    {
      id: 'idx_competition_grade',
      attributes: ['competitionId', 'gradeId'],
      type: 'key',
    },
    { id: 'idx_file', attributes: ['fileId'], type: 'unique' },
  ],
}
*/

// Team definitions
const teams = [
  { id: 'admin', name: 'Administrators' },
  { id: 'competitor', name: 'Competitors' },
]

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
  databases: Databases
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
    databases: new Databases(client),
    storage: new Storage(client),
    teams: new Teams(client),
  }
}

// Setup database
async function setupDatabase(
  { databases }: { databases: Databases },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID!

    try {
      await databases.get(databaseId)
      results.push(`Database '${databaseId}' already exists`)
    } catch (error: unknown) {
      const appwriteError = error as AppwriteError
      if (appwriteError.code === 404) {
        await databases.create(databaseId, 'Music Manager Database')
        results.push(`Created database '${databaseId}'`)
      } else {
        throw error
      }
    }

    return true
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    const message = `Error setting up database: ${appwriteError.message}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// Setup collections
async function setupCollections(
  { databases }: { databases: Databases },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID!
    let success = true

    // Setup each collection
    for (const collection of collections) {
      try {
        // Check if collection exists
        try {
          await databases.getCollection(databaseId, collection.id)
          results.push(
            `Collection '${collection.id}' already exists, checking attributes...`
          )
        } catch (error: unknown) {
          const appwriteError = error as AppwriteError
          if (appwriteError.code === 404) {
            // Create collection
            await databases.createCollection(
              databaseId,
              collection.id,
              collection.name,
              collection.permissions
            )
            results.push(`Created collection '${collection.id}'`)
          } else {
            throw error
          }
        }

        // Setup attributes
        await ensureAttributes(
          databases,
          databaseId,
          collection.id,
          collection.attributes,
          results
        )
      } catch (error: unknown) {
        const appwriteError = error as AppwriteError
        const message = `Error setting up collection '${collection.id}': ${appwriteError.message}`
        errors.push(message)
        console.error(message, error)
        success = false
      }
    }

    return success
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    const message = `Error setting up collections: ${appwriteError.message}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// No type definitions needed as we're using the methods directly

// Ensure attributes exist on collection
async function ensureAttributes(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  attributes: Attribute[],
  results: string[]
): Promise<void> {
  // Get existing attributes
  const response = await databases.listAttributes(databaseId, collectionId)
  const attributeList = response as unknown as AppwriteAttributeList
  const existingKeys = new Set(
    attributeList.attributes?.map((attr) => attr.key) || []
  )

  // Create missing attributes
  for (const attr of attributes) {
    if (!existingKeys.has(attr.key)) {
      try {
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(
              databaseId,
              collectionId,
              attr.key,
              attr.size || 255,
              attr.required,
              attr.default as string | undefined
            )
            results.push(
              `Created string attribute '${attr.key}' in collection '${collectionId}'`
            )
            break
          case 'integer':
            await databases.createIntegerAttribute(
              databaseId,
              collectionId,
              attr.key,
              attr.required,
              attr.default as number | undefined
            )
            results.push(
              `Created integer attribute '${attr.key}' in collection '${collectionId}'`
            )
            break
          case 'boolean':
            await databases.createBooleanAttribute(
              databaseId,
              collectionId,
              attr.key,
              attr.required,
              attr.default as boolean | undefined
            )
            results.push(
              `Created boolean attribute '${attr.key}' in collection '${collectionId}'`
            )
            break
          case 'float':
            await databases.createFloatAttribute(
              databaseId,
              collectionId,
              attr.key,
              attr.required,
              attr.default as number | undefined
            )
            results.push(
              `Created float attribute '${attr.key}' in collection '${collectionId}'`
            )
            break
          case 'datetime':
            await databases.createDatetimeAttribute(
              databaseId,
              collectionId,
              attr.key,
              attr.required,
              attr.default as string | undefined
            )
            results.push(
              `Created datetime attribute '${attr.key}' in collection '${collectionId}'`
            )
            break
        }
      } catch (error: unknown) {
        const appwriteError = error as AppwriteError
        // If attribute is already being created, continue
        if (appwriteError.code === 409) {
          results.push(
            `Attribute '${attr.key}' is already being created in collection '${collectionId}'`
          )
        } else {
          throw error
        }
      }
    }
  }
}

// Index creation functionality is commented out for now as it's causing issues
// We'll add it back in a future update once we resolve the compatibility issues

/*
// Setup indexes
async function setupIndexes(
  { databases }: { databases: Databases },
  results: string[],
  errors: string[]
): Promise<boolean> {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID!
    let success = true

    // Setup indexes for each collection
    for (const [collectionId, collectionIndexes] of Object.entries(indexes)) {
      try {
        for (const index of collectionIndexes) {
          await createIndexIfNotExists(
            databases,
            databaseId,
            collectionId,
            index.id,
            index.attributes,
            index.type,
            results
          )
        }
      } catch (error: unknown) {
        const appwriteError = error as AppwriteError
        const message = `Error setting up indexes for collection '${collectionId}': ${appwriteError.message}`
        errors.push(message)
        console.error(message, error)
        success = false
      }
    }

    return success
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    const message = `Error setting up indexes: ${appwriteError.message}`
    errors.push(message)
    console.error(message, error)
    return false
  }
}

// Create index if it doesn't exist
async function createIndexIfNotExists(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  indexId: string,
  attributes: string[],
  type: 'key' | 'fulltext' | 'unique',
  results: string[]
): Promise<void> {
  try {
    await databases.getIndex(databaseId, collectionId, indexId)
    results.push(
      `Index '${indexId}' already exists on collection '${collectionId}'`
    )
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      // Convert attributes to object with key properties
      const attributesObject: Record<string, string> = {}
      attributes.forEach((attr) => {
        attributesObject[attr] = 'ASC'
      })

      // Debug the index creation parameters
      console.log(
        `Creating index '${indexId}' with type '${type}' and attributes:`,
        attributesObject
      )

      // Use string literals directly in the array to avoid any type issues
      if (type === 'key') {
        await databases.createIndex(
          databaseId,
          collectionId,
          indexId,
          attributesObject as unknown as IndexType,
          ['key'] // Use string literal directly
        )
      } else if (type === 'fulltext') {
        await databases.createIndex(
          databaseId,
          collectionId,
          indexId,
          attributesObject as unknown as IndexType,
          ['fulltext'] // Use string literal directly
        )
      } else if (type === 'unique') {
        await databases.createIndex(
          databaseId,
          collectionId,
          indexId,
          attributesObject as unknown as IndexType,
          ['unique'] // Use string literal directly
        )
      }
      results.push(`Created index '${indexId}' on collection '${collectionId}'`)
    } else {
      throw error
    }
  }
}
*/

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
    const appwriteError = error as AppwriteError
    const message = `Error setting up storage: ${appwriteError.message}`
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
    const appwriteError = error as AppwriteError
    const message = `Error setting up teams: ${appwriteError.message}`
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
    const { databases, storage, teams } = initializeClient()

    // If no options provided or options.all is true, run all setup steps
    if (!options || options.all) {
      options = {
        database: true,
        collections: true,
        storage: true,
        indexes: true,
        teams: true,
      }
    }

    // Execute setup steps based on options
    if (options.database) {
      await setupDatabase({ databases }, results, errors)
    }

    if (options.collections) {
      await setupCollections({ databases }, results, errors)
    }

    if (options.storage) {
      await setupStorage({ storage }, results, errors)
    }

    if (options.teams) {
      await setupTeams({ teams }, results, errors)
    }

    // Skip index creation for now as it's causing issues
    if (options.indexes) {
      results.push('Skipping index creation due to compatibility issues')
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
      errors: [
        ...errors,
        error instanceof Error ? error.message : String(error),
      ],
    }
  }
}

// If run as a script, execute setup
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const options: SetupOptions = {}

  if (args.includes('--all')) options.all = true
  if (args.includes('--database')) options.database = true
  if (args.includes('--collections')) options.collections = true
  if (args.includes('--storage')) options.storage = true
  if (args.includes('--indexes')) options.indexes = true
  if (args.includes('--teams')) options.teams = true

  // If no specific options provided, run all
  if (Object.keys(options).length === 0) {
    options.all = true
  }

  // Run setup
  setupAppwrite(options)
    .then((result) => {
      // Log results
      console.log('\n=== SETUP RESULTS ===\n')
      result.results.forEach((message) => console.log(`- ${message}`))

      if (result.errors && result.errors.length > 0) {
        console.error('\n=== SETUP ERRORS ===\n')
        result.errors.forEach((error) => console.error(`- ${error}`))
        process.exit(1)
      } else {
        console.log('\nSetup completed successfully!')
        process.exit(0)
      }
    })
    .catch((error) => {
      console.error('Unhandled error during setup:', error)
      process.exit(1)
    })
}
