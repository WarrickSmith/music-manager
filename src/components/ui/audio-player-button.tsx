'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMusicFileViewUrl } from '@/app/actions/music-file-actions'

export type AudioPlayerVariant = 'admin' | 'competitor'

interface AudioPlayerButtonProps {
  fileId: string
  /** Kept so existing callers still compile; colours now follow the theme */
  variant?: AudioPlayerVariant
  size?: 'default' | 'sm' | 'icon'
  /** Show Play / Stop text beside the icon */
  showLabel?: boolean
  className?: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

export default function AudioPlayerButton({
  fileId,
  size = 'icon',
  showLabel = false,
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

  // Colours come from the theme, so the player follows the signed-in role
  const getButtonClasses = () =>
    cn(
      'transition-colors',
      error
        ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
        : isPlaying
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground',
      isLoading && 'animate-pulse',
      className
    )

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
      {showLabel && (isPlaying ? 'Stop' : error ? 'Retry' : 'Play')}
    </Button>
  )
}
