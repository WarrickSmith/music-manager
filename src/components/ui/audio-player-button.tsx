'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMusicFileViewUrl } from '@/app/actions/music-file-actions'

export type AudioPlayerVariant = 'admin' | 'competitor'

interface AudioPlayerButtonProps {
  fileId: string
  variant?: AudioPlayerVariant
  size?: 'default' | 'sm' | 'icon'
  className?: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

export default function AudioPlayerButton({
  fileId,
  variant = 'admin',
  size = 'icon',
  className,
  onPlayStateChange,
}: AudioPlayerButtonProps) {
  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Store event handler references for cleanup
  const endedHandlerRef = useRef<EventListener>(() => {})
  const errorHandlerRef = useRef<EventListener>(() => {})

  // Initialize audio element - but don't set src until play is clicked
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      // Create with empty src to avoid initial error
      audioRef.current = new Audio()

      // Create ended event handler and store reference
      const endedHandler: EventListener = () => {
        console.log('Audio ended')
        setIsPlaying(false)
        if (onPlayStateChange) onPlayStateChange(false)
      }

      // Store reference for cleanup
      endedHandlerRef.current = endedHandler

      // Add event listener
      audioRef.current.addEventListener('ended', endedHandler)
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current

        // Pause and reset
        audio.pause()
        audio.currentTime = 0
        audio.src = ''

        // Remove event listeners using stored references
        audio.removeEventListener('ended', endedHandlerRef.current)
        audio.removeEventListener('error', errorHandlerRef.current)

        audioRef.current = null
      }
    }
  }, [onPlayStateChange])

  // Set up global audio coordination
  useEffect(() => {
    const handleAudioPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ audioId: string }>
      const { audioId } = customEvent.detail

      // If another audio started playing and it's not this one, stop this one
      if (audioId !== fileId && isPlaying && audioRef.current) {
        console.log('Stopping audio due to another audio playing')
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
        if (onPlayStateChange) onPlayStateChange(false)
      }
    }

    // Add event listener
    window.addEventListener('audio-play', handleAudioPlay)

    // Cleanup
    return () => {
      window.removeEventListener('audio-play', handleAudioPlay)
    }
  }, [fileId, isPlaying, onPlayStateChange])

  // Dispatch global audio event when this audio plays
  useEffect(() => {
    if (isPlaying) {
      const event = new CustomEvent('audio-play', {
        detail: { audioId: fileId },
      })
      window.dispatchEvent(event)
    }
  }, [isPlaying, fileId])

  // Play function
  const playAudio = async () => {
    try {
      console.log('Play function called')
      setIsLoading(true)
      setError(null)

      if (!audioRef.current) {
        console.error('Audio element not initialized')
        setError('Audio player not initialized')
        setIsLoading(false)
        return
      }

      // Remove any existing error listener
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', errorHandlerRef.current)
      }

      // Create new error handler
      const errorHandler: EventListener = () => {
        console.error('Audio error during playback')
        setError('Failed to play audio')
        setIsPlaying(false)
        setIsLoading(false)
        if (onPlayStateChange) onPlayStateChange(false)
      }

      // Store reference for cleanup
      errorHandlerRef.current = errorHandler

      // If we don't have the URL yet, fetch it
      if (!audioUrlRef.current) {
        console.log('Fetching audio URL')
        try {
          const result = await getMusicFileViewUrl(fileId)
          audioUrlRef.current = result.url
        } catch (err) {
          console.error('Error fetching audio URL:', err)
          setError('Failed to load audio')
          setIsLoading(false)
          return
        }
      }

      // Set the source and add error listener
      audioRef.current.src = audioUrlRef.current || ''

      // Add error listener for playback errors
      audioRef.current.addEventListener('error', errorHandler)

      // Play the audio
      console.log('Starting playback')
      try {
        await audioRef.current.play()
        setIsPlaying(true)
        if (onPlayStateChange) onPlayStateChange(true)
      } catch (playError) {
        console.error('Error playing audio:', playError)
        setError('Failed to play audio')
        if (onPlayStateChange) onPlayStateChange(false)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Unexpected error in playAudio:', err)
      setError('Failed to play audio')
      setIsPlaying(false)
      setIsLoading(false)
      if (onPlayStateChange) onPlayStateChange(false)
    }
  }

  // Stop function
  const stopAudio = () => {
    console.log('Stop function called')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      if (onPlayStateChange) onPlayStateChange(false)
    }
  }

  // Get the appropriate colors based on variant and state
  const getButtonClasses = () => {
    const baseClasses = cn(
      'transition-all duration-300',
      {
        // Admin variant (purple theme)
        'bg-purple-50 hover:bg-purple-100 text-purple-600':
          variant === 'admin' && !isPlaying && !isLoading && !error,
        'bg-purple-600 hover:bg-purple-700 text-white':
          variant === 'admin' && isPlaying,
        'bg-purple-50 hover:bg-purple-100 text-purple-600 animate-pulse':
          variant === 'admin' && isLoading,
        'bg-red-50 hover:bg-red-100 text-red-600':
          variant === 'admin' && !!error,

        // Competitor variant (blue theme)
        'bg-sky-50 hover:bg-sky-100 text-sky-600':
          variant === 'competitor' && !isPlaying && !isLoading && !error,
        'bg-sky-600 hover:bg-sky-700 text-white':
          variant === 'competitor' && isPlaying,
        'bg-sky-50 hover:bg-sky-100 text-sky-600 animate-pulse':
          variant === 'competitor' && isLoading,
        'bg-red-100 hover:bg-red-200 text-red-700':
          variant === 'competitor' && !!error,
      },
      className
    )

    return baseClasses
  }

  // Get the appropriate icon based on state
  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    } else if (error) {
      return <AlertCircle className="h-4 w-4" />
    } else if (isPlaying) {
      return <Square className="h-4 w-4" />
    } else {
      return <Play className="h-4 w-4" />
    }
  }

  // Handle button click
  const handleClick = () => {
    if (isLoading) return

    if (isPlaying) {
      stopAudio()
    } else {
      playAudio()
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={getButtonClasses()}
      onClick={handleClick}
      title={error ? error : isPlaying ? 'Stop' : 'Play'}
      aria-label={error ? error : isPlaying ? 'Stop' : 'Play'}
    >
      {getIcon()}
    </Button>
  )
}
