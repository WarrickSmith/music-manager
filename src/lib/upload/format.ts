/** Format helpers for the upload progress readout */

export function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatMegabytes(bytesPerSecond)} MB/s`
}

export function formatTimeLeft(
  loaded: number,
  total: number,
  bytesPerSecond: number,
): string {
  if (bytesPerSecond <= 0 || total <= loaded) return 'calculating'
  const seconds = Math.max(1, Math.ceil((total - loaded) / bytesPerSecond))
  return seconds >= 60
    ? `about ${Math.ceil(seconds / 60)} min left`
    : `about ${seconds} s left`
}
