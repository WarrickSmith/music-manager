import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Query } from 'appwrite'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Process all documents from an Appwrite collection with pagination
 * @param listFn Function that lists documents with pagination parameters
 * @param processFn Function to process each batch of documents
 */
export async function processAllDocuments<T>(
  listFn: (
    offset: number,
    limit: number
  ) => Promise<{ documents: T[]; total: number }>,
  processFn: (documents: T[]) => Promise<void>
): Promise<void> {
  const limit = 100 // Maximum allowed by Appwrite
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const result = await listFn(offset, limit)

    if (result.documents.length > 0) {
      await processFn(result.documents)
    }

    offset += result.documents.length
    hasMore = offset < result.total && result.documents.length === limit
  }
}

/**
 * Delete all documents matching a query with proper pagination
 * @param databaseId Appwrite database ID
 * @param collectionId Appwrite collection ID
 * @param queries Appwrite Query array for filtering documents
 * @param batchSize Optional batch size for bulk operations (default 100)
 */
export async function deleteAllDocuments(
  databaseId: string,
  collectionId: string,
  queries: string[],
  batchSize = 100
): Promise<number> {
  const { databases } = await import('@/lib/appwrite-config')
  let totalDeleted = 0

  await processAllDocuments(
    async (offset, limit) => {
      const result = await databases.listDocuments(databaseId, collectionId, [
        ...queries,
        Query.limit(limit),
        Query.offset(offset),
      ])
      return result
    },
    async (documents) => {
      // Process in smaller batches to avoid overloading the server
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        await Promise.all(
          batch.map((doc) =>
            databases.deleteDocument(databaseId, collectionId, doc.$id)
          )
        )
        totalDeleted += batch.length
      }
    }
  )

  return totalDeleted
}

/**
 * Utility function to handle cascading deletes for competitors/users
 * @param userId The ID of the user being deleted
 * @returns The number of related documents deleted
 */
export async function deleteUserWithRelatedData(userId: string): Promise<{
  deletedFiles: number
  // Add more counts for future related collections
}> {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
  const result = {
    deletedFiles: 0,
    // Add more counts for future related collections
  }

  // Delete music files associated with this user
  // Once music files are implemented, uncomment and adapt this code
  /*
  result.deletedFiles = await deleteAllDocuments(
    databaseId,
    'music_files', 
    [Query.equal('userId', userId)]
  );
  */

  // Add more cascading deletes as needed for additional collections

  return result
}
