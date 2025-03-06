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

    // Create a more realistic simulation with distinct phases
    let phase = 1

    const id = setInterval(() => {
      setProgress((prev) => {
        // Each phase has its own progression logic
        switch (phase) {
          case 1: // Initial fast progress (0-40%)
            if (prev >= 40) {
              phase = 2
              return prev + 2
            }
            return prev + Math.random() * 3 + 1 // 1-4% increments

          case 2: // Middle progress (40-70%)
            if (prev >= 70) {
              phase = 3
              return prev + 1
            }
            return prev + Math.random() * 2 + 0.5 // 0.5-2.5% increments

          case 3: // Slower progress (70-90%)
            if (prev >= 90) {
              phase = 4
              return prev + 0.5
            }
            return prev + Math.random() * 1 + 0.3 // 0.3-1.3% increments

          case 4: // Final progress (90-95%)
            if (prev >= 95) {
              clearInterval(id)
              return 95 // Cap at 95% until completion is signaled
            }
            return prev + 0.2 // Very slow final progress

          default:
            return prev
        }
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

    // Smooth animation to 100%
    const finalId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(finalId)
          return 100
        }
        return prev + 1
      })
    }, 30)

    // Clean up after animation completes
    setTimeout(() => {
      clearInterval(finalId)
      setProgress(100)
      setStatus('complete')
    }, 150)
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

    // Slight progress during processing phase
    if (!intervalId) {
      const processingId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(processingId)
            return 95
          }
          return prev + 0.1
        })
      }, 500)

      setIntervalId(processingId)
    }
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
