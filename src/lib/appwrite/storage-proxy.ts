/**
 * Read a stored file from Appwrite with the server's API key, passing any
 * Range header through so browsers can seek inside audio. The bucket is
 * private, so this is the only way audio leaves storage, and callers must have
 * already checked that the signed-in user may have the file.
 */

const FILE_ID = /^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,35}$/

export function isValidFileId(fileId: string): boolean {
  return FILE_ID.test(fileId)
}

export async function fetchStoredFile(
  fileId: string,
  range?: string | null
): Promise<Response> {
  if (!isValidFileId(fileId)) throw new Error('Invalid file ID')

  const endpoint = (process.env.APPWRITE_ENDPOINT ?? '').replace(/\/+$/, '')
  const base = endpoint.endsWith('/v1') ? endpoint : `${endpoint}/v1`
  const headers: Record<string, string> = {
    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID ?? '',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '',
  }
  if (range) headers.Range = range

  return fetch(
    `${base}/storage/buckets/${encodeURIComponent(
      process.env.APPWRITE_BUCKET_ID ?? ''
    )}/files/${encodeURIComponent(fileId)}/view`,
    { headers, cache: 'no-store', redirect: 'error' }
  )
}
