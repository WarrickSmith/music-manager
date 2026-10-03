'use client'

import { AlertCircle, Loader2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/components/audio/player-provider'
import { cn } from '@/lib/utils'

interface AudioPlayerButtonProps {
  fileId: string
  /** Shown in the mini player while this file plays */
  title?: string
  subtitle?: string
  size?: 'default' | 'sm' | 'icon'
  /** Show Play / Pause text beside the icon */
  showLabel?: boolean
  className?: string
}

/**
 * Play button for one music file. All buttons share one player, so starting
 * one stops whichever file was playing, and the mini player at the bottom of
 * the screen takes over with a seek bar and time.
 */
export default function AudioPlayerButton({
  fileId,
  title = 'Music file',
  subtitle,
  size = 'icon',
  showLabel = false,
  className,
}: AudioPlayerButtonProps) {
  const player = usePlayer()
  const isCurrent = player.track?.fileId === fileId
  const status = isCurrent ? player.status : 'idle'

  const label =
    status === 'playing'
      ? 'Pause'
      : status === 'loading'
        ? 'Loading'
        : status === 'error'
          ? 'Retry'
          : 'Play'

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        'transition-colors',
        status === 'error'
          ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
          : status === 'playing'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground',
        status === 'loading' && 'animate-pulse',
        className
      )}
      onClick={() => player.toggle({ fileId, title, subtitle })}
      disabled={status === 'loading'}
      title={label}
      aria-label={`${label}: ${title}`}
    >
      {status === 'loading' ? (
        <Loader2 className="animate-spin" />
      ) : status === 'error' ? (
        <AlertCircle />
      ) : status === 'playing' ? (
        <Pause />
      ) : (
        <Play />
      )}
      {showLabel && label}
    </Button>
  )
}
