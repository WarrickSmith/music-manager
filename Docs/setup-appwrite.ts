import { Client, Databases, Storage, Permission, Role } from 'node-appwrite'

if (!process.env.APPWRITE_ENDPOINT)
  throw new Error('APPWRITE_ENDPOINT is required')
if (!process.env.APPWRITE_PROJECT_ID)
  throw new Error('APPWRITE_PROJECT_ID is required')
if (!process.env.APPWRITE_SECRET_KEY)
  throw new Error('APPWRITE_API_KEY is required')

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_SECRET_KEY)

const databases = new Databases(client)
const storage = new Storage(client)

const DATABASE_ID = 'MusicManagerDB'
const STORAGE_BUCKET_ID = 'mmfiles'

interface SetupResult {
  success: boolean
  results: string[]
  error?: unknown
}

interface Attribute {
  key: string
  type: 'string' | 'integer' | 'boolean'
  size?: number
  required: boolean
}

interface AppwriteAttribute {
  key: string
  type: string
  size?: number
  required: boolean
  status: string
  array: boolean
}

interface AppwriteAttributeList {
  total: number
  attributes: AppwriteAttribute[]
}

async function ensureAttributes(
  databaseId: string,
  collectionId: string,
  attributes: Attribute[],
  results: string[]
) {
  // Get existing attributes and safely cast to our expected type
  const response = await databases.listAttributes(databaseId, collectionId)
  const attributeList = response as unknown as AppwriteAttributeList
  const existingKeys = new Set(
    attributeList.attributes?.map((attr) => attr.key) || []
  )

  // Create missing attributes
  for (const attr of attributes) {
    if (!existingKeys.has(attr.key)) {
      switch (attr.type) {
        case 'string':
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size || 255,
            attr.required
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
            attr.required
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
            attr.required
          )
          results.push(
            `Created boolean attribute '${attr.key}' in collection '${collectionId}'`
          )
          break
      }
    }
  }
}

export async function setupAppwrite(): Promise<SetupResult> {
  const results: string[] = []
  try {
    // Create database if it doesn't exist
    try {
      await databases.get(DATABASE_ID)
      results.push('Database already exists')
    } catch {
      await databases.create(DATABASE_ID, 'Music Manager Database')
      results.push('Database created successfully')
    }

    // Set up competitions collection
    try {
      await databases.getCollection(DATABASE_ID, 'competitions')
      results.push('Competitions collection exists, checking attributes...')
      await ensureAttributes(
        DATABASE_ID,
        'competitions',
        [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'year', type: 'integer', required: true },
          { key: 'active', type: 'boolean', required: true },
        ],
        results
      )
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'competitions',
        'Competitions Collection',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )
      results.push('Competitions collection created')
      await ensureAttributes(
        DATABASE_ID,
        'competitions',
        [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'year', type: 'integer', required: true },
          { key: 'active', type: 'boolean', required: true },
        ],
        results
      )
    }

    // Set up grades collection
    try {
      await databases.getCollection(DATABASE_ID, 'grades')
      results.push('Grades collection exists, checking attributes...')
      await ensureAttributes(
        DATABASE_ID,
        'grades',
        [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'category', type: 'string', size: 255, required: true },
          { key: 'segment', type: 'string', size: 255, required: true },
          { key: 'competitionId', type: 'string', size: 255, required: true },
        ],
        results
      )
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'grades',
        'Grades Collection',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )
      results.push('Grades collection created')
      await ensureAttributes(
        DATABASE_ID,
        'grades',
        [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'category', type: 'string', size: 255, required: true },
          { key: 'segment', type: 'string', size: 255, required: true },
          { key: 'competitionId', type: 'string', size: 255, required: true },
        ],
        results
      )
    }

    // Set up music_files collection with complete schema from data model
    try {
      await databases.getCollection(DATABASE_ID, 'musicfiles')
      results.push('Music files collection exists, checking attributes...')
      await ensureAttributes(
        DATABASE_ID,
        'musicfiles',
        [
          { key: 'originalName', type: 'string', size: 255, required: true },
          { key: 'fileName', type: 'string', size: 255, required: true },
          { key: 'storagePath', type: 'string', size: 255, required: true },
          { key: 'downloadURL', type: 'string', size: 255, required: true },
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
        results
      )
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'musicfiles',
        'Music Files Collection',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )
      results.push('Music files collection created')
      await ensureAttributes(
        DATABASE_ID,
        'musicfiles',
        [
          { key: 'originalName', type: 'string', size: 255, required: true },
          { key: 'fileName', type: 'string', size: 255, required: true },
          { key: 'storagePath', type: 'string', size: 255, required: true },
          { key: 'downloadURL', type: 'string', size: 255, required: true },
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
        results
      )
    }

    // Set up storage bucket
    try {
      await storage.getBucket(STORAGE_BUCKET_ID)
      results.push('Storage bucket already exists')
    } catch {
      await storage.createBucket(STORAGE_BUCKET_ID, 'MM Files', [
        Permission.read(Role.any()),
        Permission.write(Role.any()),
      ])
      results.push('Storage bucket created successfully')
    }

    results.push('Database setup completed successfully')
    return { success: true, results }
  } catch (error) {
    console.error('Error setting up database:', error)
    return { success: false, error, results }
  }
}
