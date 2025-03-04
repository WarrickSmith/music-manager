#!/usr/bin/env node
import * as dotenv from 'dotenv'
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

import {
  Client,
  Databases,
  Storage,
  ID,
  Teams,
  type IndexType,
} from 'node-appwrite'
import { defaultGrades } from '../Docs/default-grades'

// Custom error type for better type safety
interface AppwriteError extends Error {
  code?: number
  response?: unknown
}

// Initialize Appwrite client
function initializeClient() {
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

async function setupDatabase(databases: Databases) {
  const databaseId = process.env.APPWRITE_DATABASE_ID!

  try {
    await databases.get(databaseId)
    console.log(`Database '${databaseId}' already exists`)
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await databases.create(databaseId, 'Music Manager Database')
      console.log(`Created database '${databaseId}'`)
    } else {
      throw error
    }
  }
}

async function setupCollections(databases: Databases) {
  const databaseId = process.env.APPWRITE_DATABASE_ID!

  // Setup competitions collection
  try {
    await databases.getCollection(databaseId, 'competitions')
    console.log('Competitions collection already exists')
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await databases.createCollection(
        databaseId,
        'competitions',
        'Competitions Collection'
      )
      console.log('Created competitions collection')

      // Add attributes
      await databases.createStringAttribute(
        databaseId,
        'competitions',
        'name',
        255,
        true
      )
      await databases.createIntegerAttribute(
        databaseId,
        'competitions',
        'year',
        true
      )
      await databases.createBooleanAttribute(
        databaseId,
        'competitions',
        'active',
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'competitions',
        'description',
        1000,
        false
      )
      await databases.createDatetimeAttribute(
        databaseId,
        'competitions',
        'startDate',
        false
      )
      await databases.createDatetimeAttribute(
        databaseId,
        'competitions',
        'endDate',
        false
      )

      // Add indexes using object format for attributes
      const activeIndex = { active: 'ASC' }
      const yearIndex = { year: 'ASC' }

      await databases.createIndex(
        databaseId,
        'competitions',
        'idx_active',
        activeIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'competitions',
        'idx_year',
        yearIndex as unknown as IndexType,
        ['key']
      )
    } else {
      throw error
    }
  }

  // Setup grades collection
  try {
    await databases.getCollection(databaseId, 'grades')
    console.log('Grades collection already exists')
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await databases.createCollection(
        databaseId,
        'grades',
        'Grades Collection'
      )
      console.log('Created grades collection')

      // Add attributes
      await databases.createStringAttribute(
        databaseId,
        'grades',
        'name',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'grades',
        'category',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'grades',
        'segment',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'grades',
        'competitionId',
        255,
        true
      )
      await databases.createBooleanAttribute(
        databaseId,
        'grades',
        'isTemplate',
        false,
        false
      )
      await databases.createStringAttribute(
        databaseId,
        'grades',
        'description',
        1000,
        false
      )

      // Add indexes using object format for attributes
      const competitionIndex = { competitionId: 'ASC' }
      const templateIndex = { competitionId: 'ASC', isTemplate: 'ASC' }

      await databases.createIndex(
        databaseId,
        'grades',
        'idx_competition',
        competitionIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'grades',
        'idx_competition_template',
        templateIndex as unknown as IndexType,
        ['key']
      )
    } else {
      throw error
    }
  }

  // Setup musicfiles collection
  try {
    await databases.getCollection(databaseId, 'musicfiles')
    console.log('Music files collection already exists')
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await databases.createCollection(
        databaseId,
        'musicfiles',
        'Music Files Collection'
      )
      console.log('Created music files collection')

      // Add attributes
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'originalName',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'fileName',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'storagePath',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'downloadURL',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'competitionId',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'competitionName',
        255,
        true
      )
      await databases.createIntegerAttribute(
        databaseId,
        'musicfiles',
        'competitionYear',
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'gradeId',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'gradeType',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'gradeCategory',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'gradeSegment',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'userId',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'userName',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'uploadedAt',
        255,
        true
      )
      await databases.createIntegerAttribute(
        databaseId,
        'musicfiles',
        'duration',
        false
      )
      await databases.createIntegerAttribute(
        databaseId,
        'musicfiles',
        'size',
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'status',
        255,
        true
      )
      await databases.createStringAttribute(
        databaseId,
        'musicfiles',
        'fileId',
        255,
        true
      )

      // Add indexes using object format for attributes
      const userIndex = { userId: 'ASC' }
      const competitionIndex = { competitionId: 'ASC' }
      const gradeIndex = { gradeId: 'ASC' }
      const compGradeIndex = { competitionId: 'ASC', gradeId: 'ASC' }
      const fileIndex = { fileId: 'ASC' }

      await databases.createIndex(
        databaseId,
        'musicfiles',
        'idx_user',
        userIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'musicfiles',
        'idx_competition',
        competitionIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'musicfiles',
        'idx_grade',
        gradeIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'musicfiles',
        'idx_competition_grade',
        compGradeIndex as unknown as IndexType,
        ['key']
      )
      await databases.createIndex(
        databaseId,
        'musicfiles',
        'idx_file',
        fileIndex as unknown as IndexType,
        ['unique']
      )
    } else {
      throw error
    }
  }
}

async function setupStorage(storage: Storage) {
  const bucketId = process.env.APPWRITE_BUCKET_ID!

  try {
    await storage.getBucket(bucketId)
    console.log(`Storage bucket '${bucketId}' already exists`)
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      // Create bucket with empty permissions array
      await storage.createBucket(bucketId, 'Music Manager Files', [])
      console.log(`Created storage bucket '${bucketId}'`)
    } else {
      throw error
    }
  }
}

async function setupTeams(teams: Teams) {
  // Create admin team
  try {
    await teams.get('admin')
    console.log('Admin team already exists')
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await teams.create('admin', 'Administrators')
      console.log('Created admin team')
    } else {
      throw error
    }
  }

  // Create competitor team
  try {
    await teams.get('competitor')
    console.log('Competitor team already exists')
  } catch (error: unknown) {
    const appwriteError = error as AppwriteError
    if (appwriteError.code === 404) {
      await teams.create('competitor', 'Competitors')
      console.log('Created competitor team')
    } else {
      throw error
    }
  }
}

async function importDefaultGrades(databases: Databases) {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  const gradesCollectionId = 'grades'

  // Import default grades as templates
  let importedCount = 0

  for (const grade of defaultGrades) {
    try {
      await databases.createDocument(
        databaseId,
        gradesCollectionId,
        ID.unique(),
        {
          ...grade,
          isTemplate: true,
          competitionId: 'template',
          description: `Default template for ${grade.name} ${grade.category} ${grade.segment}`,
        }
      )
      importedCount++
    } catch (error) {
      console.error(`Error importing grade: ${error}`)
    }
  }

  console.log(`Successfully imported ${importedCount} default grade templates`)
}

async function main() {
  try {
    console.log('Starting Appwrite setup...')

    const { databases, storage, teams } = initializeClient()

    // Setup database
    await setupDatabase(databases)

    // Setup collections
    await setupCollections(databases)

    // Setup storage
    await setupStorage(storage)

    // Setup teams
    await setupTeams(teams)

    // Import default grades
    await importDefaultGrades(databases)

    console.log('Appwrite setup completed successfully!')
  } catch (error) {
    console.error('Error during setup:', error)
    process.exit(1)
  }
}

// Run the setup
main()
