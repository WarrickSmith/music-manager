'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { cn } from '@/lib/utils'

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
  const { playerState, error, togglePlayPause, stop, isPlaying } =
    useAudioPlayer({
      fileId,
      onPlayStateChange,
    })

  // Set up global audio coordination
  useEffect(() => {
    // Create a custom event for audio playback coordination
    const handleAudioPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ audioId: string }>
      const { audioId } = customEvent.detail

      // If another audio started playing and it's not this one, stop this one
      if (audioId !== fileId && isPlaying) {
        stop()
      }
    }

    // Define the event name as a type-safe string
    const eventName = 'audio-play'

    // Add event listener for audio play events
    window.addEventListener(eventName, handleAudioPlay)

    // Cleanup
    return () => {
      window.removeEventListener(eventName, handleAudioPlay)
    }
  }, [fileId, isPlaying, stop])

  // Dispatch global audio event when this audio plays
  useEffect(() => {
    if (isPlaying) {
      const event = new CustomEvent('audio-play', {
        detail: { audioId: fileId },
      })
      window.dispatchEvent(event)
    }
  }, [isPlaying, fileId])

  // Get the appropriate colors based on variant and state
  const getButtonClasses = () => {
    const baseClasses = cn(
      'transition-all duration-300',
      {
        // Admin variant (purple theme)
        'bg-purple-50 hover:bg-purple-100 text-purple-600':
          variant === 'admin' && playerState === 'idle',
        'bg-purple-100 hover:bg-purple-200 text-purple-700':
          variant === 'admin' && playerState === 'paused',
        'bg-purple-600 hover:bg-purple-700 text-white':
          variant === 'admin' && playerState === 'playing',
        'bg-purple-50 hover:bg-purple-100 text-purple-600 animate-pulse':
          variant === 'admin' && playerState === 'loading',
        'bg-red-50 hover:bg-red-100 text-red-600':
          variant === 'admin' && playerState === 'error',

        // Competitor variant (blue theme)
        'bg-sky-50 hover:bg-sky-100 text-sky-600':
          variant === 'competitor' && playerState === 'idle',
        'bg-sky-100 hover:bg-sky-200 text-sky-700':
          variant === 'competitor' && playerState === 'paused',
        'bg-sky-600 hover:bg-sky-700 text-white':
          variant === 'competitor' && playerState === 'playing',
        'bg-sky-50 hover:bg-sky-100 text-sky-600 animate-pulse':
          variant === 'competitor' && playerState === 'loading',
        'bg-red-100 hover:bg-red-200 text-red-700':
          variant === 'competitor' && playerState === 'error',
      },
      className
    )

    return baseClasses
  }

  // Get the appropriate icon based on state
  const getIcon = () => {
    switch (playerState) {
      case 'playing':
        return <Pause className="h-4 w-4" />
      case 'paused':
        return <Play className="h-4 w-4" />
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'idle':
      default:
        return <Play className="h-4 w-4" />
    }
  }

  // Handle button click
  const handleClick = () => {
    if (playerState === 'playing') {
      stop()
    } else {
      togglePlayPause()
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={getButtonClasses()}
      onClick={handleClick}
      title={
        playerState === 'error'
          ? error || 'Error playing audio'
          : playerState === 'playing'
          ? 'Stop'
          : 'Play'
      }
      aria-label={
        playerState === 'error'
          ? error || 'Error playing audio'
          : playerState === 'playing'
          ? 'Stop'
          : 'Play'
      }
    >
      {getIcon()}
    </Button>
  )
}
