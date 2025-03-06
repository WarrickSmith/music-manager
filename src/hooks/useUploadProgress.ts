import { useState, useEffect } from 'react'

// This is a simulated progress tracker since we can't use the client-side SDK
// It provides a reasonable approximation of upload progress for the UI
export const useUploadProgress = () => {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle')
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Reset progress and status
  const reset = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setProgress(0)
    setStatus('idle')
  }

  // Start upload progress simulation
  const startProgress = () => {
    reset()
    setStatus('uploading')

    // Simulate progress with realistic slowdown as progress increases
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(id)
          return prev
        }

        // Slower progress as we get closer to 100%
        const increment = prev < 50 ? 5 : prev < 80 ? 3 : 1
        return Math.min(prev + increment, 95)
      })
    }, 200)

    setIntervalId(id)
  }

  // Complete the progress
  const completeProgress = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setProgress(100)
    setStatus('complete')
  }

  // Set error state
  const setError = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setStatus('error')
  }

  // Set processing state (after upload, before complete)
  const setProcessing = () => {
    setStatus('processing')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [intervalId])

  return {
    progress,
    status,
    startProgress,
    completeProgress,
    setProcessing,
    setError,
    reset,
  }
}
