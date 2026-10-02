import { tablesDB, Query } from '@/lib/appwrite/server'
import type { Models } from 'node-appwrite'

const PAGE = 100 // The most rows Appwrite returns per request

/** Every row matching the queries, fetched page by page */
export async function listAllRows(
  tableId: string,
  queries: string[] = []
): Promise<Models.DefaultRow[]> {
  const databaseId = process.env.APPWRITE_DATABASE_ID!
  const rows: Models.DefaultRow[] = []
  let offset = 0
  while (true) {
    const response = await tablesDB.listRows({
      databaseId,
      tableId,
      queries: [...queries, Query.limit(PAGE), Query.offset(offset)],
    })
    rows.push(...response.rows)
    if (response.rows.length < PAGE) return rows
    offset += PAGE
  }
}

/** Rows with the given IDs, fetched in batches */
export async function getRowsByIds(
  tableId: string,
  ids: string[]
): Promise<Models.DefaultRow[]> {
  const unique = [...new Set(ids)]
  const rows: Models.DefaultRow[] = []
  for (let i = 0; i < unique.length; i += PAGE) {
    rows.push(
      ...(await listAllRows(tableId, [
        Query.equal('$id', unique.slice(i, i + PAGE)),
      ]))
    )
  }
  return rows
}

/** True when an Appwrite error means the table or collection does not exist */
export function isMissingTableError(error: unknown): boolean {
  const e = error as { code?: number; type?: string; message?: string }
  return (
    e?.code === 404 ||
    /collection_not_found|table_not_found/.test(e?.type ?? '') ||
    /could not be found/i.test(e?.message ?? '')
  )
}
