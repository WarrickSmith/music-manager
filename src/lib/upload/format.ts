/** Format helpers for the upload progress readout */

/** Bytes as KB below one megabyte, otherwise MB, so small files do not read 0.0 MB */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function formatTimeLeft(
  loaded: number,
  total: number,
  bytesPerSecond: number
): string {
  if (bytesPerSecond <= 0 || total <= loaded) return 'calculating'
  const seconds = Math.max(1, Math.ceil((total - loaded) / bytesPerSecond))
  return seconds >= 60
    ? `about ${Math.ceil(seconds / 60)} min left`
    : `about ${seconds} s left`
}
