/**
 * Where to stream or download a stored music file. Files are served by the
 * app's own authenticated route, never directly from Appwrite storage, so the
 * server decides who may listen to or download each file.
 */
export function musicFileUrl(
  fileId: string,
  options: { download?: boolean } = {}
): string {
  const url = `/api/music/file/${encodeURIComponent(fileId)}`
  return options.download ? `${url}?download=1` : url
}
