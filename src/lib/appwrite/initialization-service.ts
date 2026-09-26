'use server'

import { tablesDB, storage } from '@/lib/appwrite/server'
import {
  describeAppwriteError,
  getTableIds,
  setupAppwrite,
} from '../../../scripts/setup-appwrite'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!

// Define an error interface for type checking inside catch blocks
interface AppwriteError {
  code?: number
  message?: string
}

/**
 * Run a lookup and report whether the resource exists. A 404 means it is
 * missing; anything else (usually a 401 for a missing API key scope) is
 * recorded so the admin sees the real cause instead of "missing".
 */
async function resourceExists(
  label: string,
  lookup: () => Promise<unknown>,
  errors: string[]
): Promise<boolean> {
  try {
    await lookup()
    return true
  } catch (err: unknown) {
    const appwriteError = err as AppwriteError
    if (appwriteError.code !== 404) {
      console.error(`Error checking ${label}:`, err)
      errors.push(`${label}: ${describeAppwriteError(err)}`)
    }
    return false
  }
}

/**
 * Check if Appwrite resources are properly initialized
 */
export async function checkAppwriteInitialization() {
  try {
    const tableIds = getTableIds()
    const errors: string[] = []

    const databaseExists = await resourceExists(
      'database',
      () => tablesDB.get({ databaseId }),
      errors
    )

    // Only check tables if the database exists
    const [
      musicFilesCollectionExists,
      competitionsCollectionExists,
      gradesCollectionExists,
    ] = databaseExists
      ? await Promise.all(
          [tableIds.musicFiles, tableIds.competitions, tableIds.grades].map(
            (tableId) =>
              resourceExists(
                `${tableId} table`,
                () => tablesDB.getTable({ databaseId, tableId }),
                errors
              )
          )
        )
      : [false, false, false]

    const storageBucketExists = await resourceExists(
      'storage bucket',
      () => storage.getBucket(bucketId),
      errors
    )

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
export async function initializeAppwrite(): Promise<{
  success: boolean
  message: string
  errors?: string[]
}> {
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
      }
    }

    return {
      success: true,
      message: 'Appwrite resources initialized successfully',
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
