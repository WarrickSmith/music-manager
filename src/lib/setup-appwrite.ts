import { Client, Databases, Storage, Permission, Role } from 'node-appwrite'

if (!process.env.APPWRITE_ENDPOINT)
  throw new Error('APPWRITE_ENDPOINT is required')
if (!process.env.APPWRITE_PROJECT_ID)
  throw new Error('APPWRITE_PROJECT_ID is required')
if (!process.env.APPWRITE_API_KEY)
  throw new Error('APPWRITE_API_KEY is required')

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const databases = new Databases(client)
const storage = new Storage(client)

const DATABASE_ID = 'MusicManagerDB'
const STORAGE_BUCKET_ID = 'mmfiles'

interface SetupResult {
  success: boolean
  results: string[]
  error?: unknown
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
      results.push('Competitions collection already exists')
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'competitions',
        'Competitions Collection',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )

      // Add attributes
      await databases.createStringAttribute(
        DATABASE_ID,
        'competitions',
        'name',
        255,
        true
      )
      await databases.createIntegerAttribute(
        DATABASE_ID,
        'competitions',
        'year',
        true
      )
      await databases.createBooleanAttribute(
        DATABASE_ID,
        'competitions',
        'active',
        true
      )

      results.push('Competitions collection created with attributes')
    }

    // Set up grades collection
    try {
      await databases.getCollection(DATABASE_ID, 'grades')
      results.push('Grades collection already exists')
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'grades',
        'Grades Collection',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )

      // Add attributes
      await databases.createStringAttribute(
        DATABASE_ID,
        'grades',
        'name',
        255,
        true
      )
      await databases.createStringAttribute(
        DATABASE_ID,
        'grades',
        'category',
        255,
        true
      )
      await databases.createStringAttribute(
        DATABASE_ID,
        'grades',
        'segment',
        255,
        true
      )
      await databases.createStringAttribute(
        DATABASE_ID,
        'grades',
        'competitionId',
        255,
        true
      )

      results.push('Grades collection created with attributes')
    }

    // Set up music_files collection
    try {
      await databases.getCollection(DATABASE_ID, 'musicfiles')
      results.push('Music files collection already exists')
    } catch {
      await databases.createCollection(
        DATABASE_ID,
        'musicfiles',
        'Music Files',
        [Permission.read(Role.any()), Permission.write(Role.any())]
      )

      // Add attributes
      await databases.createStringAttribute(
        DATABASE_ID,
        'musicfiles',
        'competitionId',
        255,
        true
      )
      await databases.createStringAttribute(
        DATABASE_ID,
        'musicfiles',
        'fileId',
        255,
        true
      )

      results.push('Music files collection created with attributes')
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
