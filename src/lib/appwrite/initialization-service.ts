'use server'

import { databases, storage } from '@/lib/appwrite/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!
const musicFilesCollectionId = 'musicfiles'
const competitionsCollectionId = 'competitions'

// Define an error interface for type checking inside catch blocks
interface AppwriteError {
  code?: number
  message?: string
}

/**
 * Check if Appwrite resources are properly initialized
 */
export async function checkAppwriteInitialization() {
  try {
    // Check if database exists
    let databaseExists = false
    let musicFilesCollectionExists = false
    let competitionsCollectionExists = false
    let storageBucketExists = false

    try {
      await databases.get(databaseId)
      databaseExists = true

      // If database exists, check if collections exist
      try {
        await databases.getCollection(databaseId, musicFilesCollectionId)
        musicFilesCollectionExists = true
      } catch (err: unknown) {
        // Type check the error to see if it's an Appwrite error with a code
        const appwriteError = err as AppwriteError
        if (appwriteError.code !== 404) {
          console.error('Error checking music files collection:', err)
        }
      }

      try {
        await databases.getCollection(databaseId, competitionsCollectionId)
        competitionsCollectionExists = true
      } catch (err: unknown) {
        const appwriteError = err as AppwriteError
        if (appwriteError.code !== 404) {
          console.error('Error checking competitions collection:', err)
        }
      }
    } catch (err: unknown) {
      const appwriteError = err as AppwriteError
      if (appwriteError.code !== 404) {
        console.error('Error checking database:', err)
      }
    }

    // Check if storage bucket exists
    try {
      await storage.getBucket(bucketId)
      storageBucketExists = true
    } catch (err: unknown) {
      const appwriteError = err as AppwriteError
      if (appwriteError.code !== 404) {
        console.error('Error checking storage bucket:', err)
      }
    }

    const isInitialized =
      databaseExists &&
      musicFilesCollectionExists &&
      competitionsCollectionExists &&
      storageBucketExists

    return {
      isInitialized,
      details: {
        databaseExists,
        musicFilesCollectionExists,
        competitionsCollectionExists,
        storageBucketExists,
      },
    }
  } catch (error) {
    console.error('Error checking Appwrite initialization:', error)
    throw new Error('Failed to check Appwrite initialization status')
  }
}

/**
 * Initialize Appwrite resources by running the setup script
 */
export async function initializeAppwrite() {
  try {
    console.log('Running Appwrite initialization script...')
    const result = await execAsync('npm run setup:appwrite')
    console.log('Initialization result:', result.stdout)
    return {
      success: true,
      message: 'Appwrite resources initialized successfully',
    }
  } catch (error) {
    console.error('Error initializing Appwrite:', error)
    throw new Error('Failed to initialize Appwrite resources')
  }
}
