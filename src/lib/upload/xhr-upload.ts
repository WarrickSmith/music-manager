/**
 * Upload a FormData body with real byte-level progress.
 *
 * fetch() cannot report upload progress, so this uses XMLHttpRequest. The
 * promise rejects with an UploadError whose message is safe to show to the
 * user, and whose `details` carry the technical cause for an error report.
 */

export interface UploadProgress {
  loaded: number
  total: number
  /** Smoothed bytes per second, 0 until enough data has been sent */
  bytesPerSecond: number
}

export type UploadPhase = 'uploading' | 'processing'

export class UploadError extends Error {
  constructor(
    message: string,
    public details: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'UploadError'
  }
}

export interface UploadHandlers {
  onProgress?: (progress: UploadProgress) => void
  /** Called once every byte has been sent and the server is still working */
  onProcessing?: () => void
  signal?: AbortSignal
}

// Weight given to the newest speed sample; higher reacts faster, lower is steadier
const SPEED_SMOOTHING = 0.3

export function uploadWithProgress<T = unknown>(
  url: string,
  body: FormData,
  { onProgress, onProcessing, signal }: UploadHandlers = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0
    let lastTime = Date.now()
    let speed = 0

    xhr.open('POST', url)
    xhr.responseType = 'text'

    xhr.upload.onprogress = (event) => {
      const now = Date.now()
      const elapsed = (now - lastTime) / 1000
      if (elapsed > 0) {
        const sample = (event.loaded - lastLoaded) / elapsed
        speed =
          speed === 0 ? sample : speed + SPEED_SMOOTHING * (sample - speed)
        lastLoaded = event.loaded
        lastTime = now
      }
      if (event.lengthComputable) {
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          bytesPerSecond: speed,
        })
      }
    }

    xhr.upload.onload = () => onProcessing?.()

    xhr.onerror = () =>
      reject(
        new UploadError(
          'The upload could not reach the server. Check your connection and try again.',
          'Network error while sending the file',
        ),
      )
    xhr.ontimeout = () =>
      reject(
        new UploadError(
          'The upload timed out. Try again, or use a smaller file.',
          'Request timed out',
        ),
      )
    xhr.onabort = () =>
      reject(new UploadError('The upload was cancelled.', 'Upload aborted'))

    xhr.onload = () => {
      let payload: { success?: boolean; error?: string } | null = null
      try {
        payload = JSON.parse(xhr.responseText)
      } catch {
        payload = null
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
        resolve(payload as T)
        return
      }

      const reason =
        payload?.error ||
        (xhr.status === 413
          ? 'The file is too large for the server.'
          : `The server returned an unexpected response (${xhr.status}).`)
      reject(
        new UploadError(
          reason,
          `HTTP ${xhr.status} ${xhr.statusText}: ${xhr.responseText.slice(0, 500)}`,
          xhr.status,
        ),
      )
    }

    if (signal) {
      if (signal.aborted) {
        reject(new UploadError('The upload was cancelled.', 'Upload aborted'))
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(body)
  })
}
