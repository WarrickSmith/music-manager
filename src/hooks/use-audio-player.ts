'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getMusicFileViewUrl } from '@/app/actions/music-file-actions'

export type AudioPlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error'

interface UseAudioPlayerProps {
  fileId: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

// Extend HTMLAudioElement to store event handlers for cleanup
interface ExtendedAudioElement extends HTMLAudioElement {
  canPlayHandler?: EventListener
  playingHandler?: EventListener
  pauseHandler?: EventListener
  endedHandler?: EventListener
  errorHandler?: EventListener
  timeUpdateHandler?: EventListener
}

export function useAudioPlayer({
  fileId,
  onPlayStateChange,
}: UseAudioPlayerProps) {
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle')
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<ExtendedAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)
  const shouldPlayOnInitRef = useRef(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Improved cleanup function to remove all event listeners
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      // Remove all event listeners
      if (audio.canPlayHandler) {
        audio.removeEventListener('canplay', audio.canPlayHandler)
      }
      if (audio.playingHandler) {
        audio.removeEventListener('playing', audio.playingHandler)
      }
      if (audio.pauseHandler) {
        audio.removeEventListener('pause', audio.pauseHandler)
      }
      if (audio.endedHandler) {
        audio.removeEventListener('ended', audio.endedHandler)
      }
      if (audio.errorHandler) {
        audio.removeEventListener('error', audio.errorHandler)
      }
      if (audio.timeUpdateHandler) {
        audio.removeEventListener('timeupdate', audio.timeUpdateHandler)
      }

      // Pause and reset
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      audioRef.current = null
    }

    urlRef.current = null
    isInitializedRef.current = false
    shouldPlayOnInitRef.current = false
    retryCountRef.current = 0
    setPlayerState('idle')
    if (onPlayStateChange) onPlayStateChange(false)
  }, [onPlayStateChange])

  // Initialize or reset audio element
  const initAudio = useCallback(async () => {
    try {
      // Clean up any existing audio
      if (audioRef.current) {
        cleanup()
      }

      setPlayerState('loading')
      setError(null)

      // Get the streaming URL
      const { url } = await getMusicFileViewUrl(fileId)
      urlRef.current = url

      // Create new audio element
      const audio = new Audio() as ExtendedAudioElement

      // Set required attributes for better streaming performance
      audio.crossOrigin = 'anonymous' // Enable CORS for cross-origin resources
      audio.preload = 'auto' // Preload audio data

      // Define event handlers
      const canPlayHandler = () => {
        console.log('Audio can play now')
        isInitializedRef.current = true
        retryCountRef.current = 0 // Reset retry counter on success

        // If we should play on init, do it now
        if (shouldPlayOnInitRef.current) {
          console.log('Auto-playing after initialization')
          audio
            .play()
            .then(() => {
              console.log('Auto-play successful')
              setPlayerState('playing')
              if (onPlayStateChange) onPlayStateChange(true)
            })
            .catch((e) => {
              console.error('Auto-play failed:', e)
              setPlayerState('idle')
            })
        } else {
          setPlayerState('idle')
        }
      }

      const playingHandler = () => {
        console.log('Audio playing event')
        setPlayerState('playing')
        if (onPlayStateChange) onPlayStateChange(true)
      }

      const pauseHandler = () => {
        console.log('Audio paused event')
        // Always set to idle state when paused
        setPlayerState('idle')
        if (onPlayStateChange) onPlayStateChange(false)
      }

      const endedHandler = () => {
        console.log('Audio ended event')
        setPlayerState('idle')
        if (onPlayStateChange) onPlayStateChange(false)
      }

      // Regular timeupdate handler to detect and handle stalled playback
      const timeUpdateHandler = () => {
        // Audio is playing if we get timeupdate events
        // This helps recover from some stalled states
        if (playerState === 'loading' && audio.currentTime > 0) {
          setPlayerState('playing')
          if (onPlayStateChange) onPlayStateChange(true)
        }
      }

      const errorHandler = async (e: Event) => {
        // Only handle error if component is still mounted
        if (audioRef.current === audio) {
          console.error('Audio playback error:', e)

          // Try to recover with retry logic
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++
            console.log(
              `Retrying audio initialization (${retryCountRef.current}/${maxRetries})`
            )

            // Wait a moment before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Get a fresh URL with a new cache buster
            try {
              const { url: freshUrl } = await getMusicFileViewUrl(fileId)

              // Set the new URL and try again
              audio.src = freshUrl
              audio.load()
              return
            } catch (refreshError) {
              console.error('Error refreshing streaming URL:', refreshError)
            }
          }

          // If we reach here, all retries failed
          setPlayerState('error')
          setError('Failed to play audio file')
          if (onPlayStateChange) onPlayStateChange(false)
        }
      }

      // Store handlers for cleanup
      audio.canPlayHandler = canPlayHandler
      audio.playingHandler = playingHandler
      audio.pauseHandler = pauseHandler
      audio.endedHandler = endedHandler
      audio.errorHandler = errorHandler
      audio.timeUpdateHandler = timeUpdateHandler

      // Add event listeners
      audio.addEventListener('canplay', canPlayHandler)
      audio.addEventListener('playing', playingHandler)
      audio.addEventListener('pause', pauseHandler)
      audio.addEventListener('ended', endedHandler)
      audio.addEventListener('error', errorHandler)
      audio.addEventListener('timeupdate', timeUpdateHandler)

      // Set the source and store the reference
      audio.src = url
      audioRef.current = audio

      // Start loading the audio
      audio.load()
    } catch (err) {
      console.error('Error initializing audio:', err)
      setPlayerState('error')
      setError(err instanceof Error ? err.message : 'Failed to load audio file')
      if (onPlayStateChange) onPlayStateChange(false)
    }
  }, [fileId, cleanup, onPlayStateChange])

  // Play function - only handles starting playback
  const togglePlayPause = useCallback(async () => {
    try {
      console.log('togglePlayPause called, current state:', playerState)

      // If not initialized, set flag to play on init and initialize
      if (!isInitializedRef.current || !audioRef.current || !urlRef.current) {
        console.log('First click - initializing audio and setting play flag')
        shouldPlayOnInitRef.current = true
        await initAudio()
        return
      }

      const audio = audioRef.current

      // Only handle play functionality here
      if (playerState === 'idle' || playerState === 'paused') {
        console.log('Playing audio - current time:', audio.currentTime)
        try {
          // Reset playback position if at the end
          if (audio.ended || audio.currentTime >= audio.duration - 0.1) {
            audio.currentTime = 0
          }

          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error('Error playing audio:', err)
              setPlayerState('error')
              setError('Failed to play audio file')
            })
          }
        } catch (err) {
          console.error('Error playing audio:', err)
          setPlayerState('error')
          setError('Failed to play audio file')
        }
      } else if (playerState === 'playing') {
        // Add support for pausing
        console.log('Pausing audio - current time:', audio.currentTime)
        audio.pause()
        setPlayerState('idle')
        if (onPlayStateChange) onPlayStateChange(false)
      } else if (playerState === 'error') {
        // Try to reinitialize on error
        shouldPlayOnInitRef.current = true
        await initAudio()
      }
    } catch (err) {
      console.error('Error toggling play/stop:', err)
      setPlayerState('error')
      setError(err instanceof Error ? err.message : 'Failed to play audio file')
    }
  }, [playerState, initAudio, onPlayStateChange])

  // Stop function
  const stop = useCallback(async () => {
    console.log('Stop function called')
    if (audioRef.current) {
      const audio = audioRef.current
      audio.pause()
      audio.currentTime = 0

      // Ensure state is updated
      setPlayerState('idle')
      if (onPlayStateChange) onPlayStateChange(false)

      // Add a small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }, [onPlayStateChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    playerState,
    error,
    togglePlayPause,
    stop,
    isPlaying: playerState === 'playing',
  }
}
