import { useCallback, useEffect, useRef, useState } from 'react'
import {
  UploadError,
  uploadWithProgress,
  type UploadProgress,
} from '@/lib/upload/xhr-upload'

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error'

export interface UploadFailure {
  /** Plain message for the user */
  message: string
  /** Technical detail to include in an error report */
  details: string
  /** Machine-readable reason from the server, e.g. "exists" or "deadline" */
  code?: string
}

/**
 * Tracks one upload with real progress: bytes sent, speed, and the phase
 * (sending the file, then the server saving it).
 */
export const useUploadProgress = () => {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [loaded, setLoaded] = useState(0)
  const [total, setTotal] = useState(0)
  const [bytesPerSecond, setBytesPerSecond] = useState(0)
  const [failure, setFailure] = useState<UploadFailure | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
    setLoaded(0)
    setTotal(0)
    setBytesPerSecond(0)
    setFailure(null)
  }, [])

  const upload = useCallback(
    async <T>(url: string, body: FormData): Promise<T> => {
      const controller = new AbortController()
      abortRef.current = controller
      setStatus('uploading')
      setLoaded(0)
      setTotal(0)
      setBytesPerSecond(0)
      setFailure(null)

      try {
        const result = await uploadWithProgress<T>(url, body, {
          signal: controller.signal,
          onProgress: (p: UploadProgress) => {
            setLoaded(p.loaded)
            setTotal(p.total)
            setBytesPerSecond(p.bytesPerSecond)
          },
          onProcessing: () => setStatus('processing'),
        })
        setStatus('complete')
        return result
      } catch (error) {
        const uploadError =
          error instanceof UploadError
            ? error
            : new UploadError(
                'The upload failed unexpectedly.',
                error instanceof Error ? error.message : String(error),
              )
        setFailure({
          message: uploadError.message,
          details: uploadError.details,
          code: uploadError.code,
        })
        setStatus('error')
        throw uploadError
      } finally {
        abortRef.current = null
      }
    },
    [],
  )

  // Stop an in-flight upload if the form is closed
  useEffect(() => () => abortRef.current?.abort(), [])

  const progress =
    status === 'complete' || status === 'processing'
      ? 100
      : total > 0
        ? Math.min(100, (loaded / total) * 100)
        : 0

  return {
    status,
    progress,
    loaded,
    total,
    bytesPerSecond,
    failure,
    upload,
    reset,
  }
}
