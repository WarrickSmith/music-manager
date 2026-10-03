'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, Loader2, Pause, Play, X } from 'lucide-react'
import { musicFileUrl } from '@/lib/music/urls'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'

export interface Track {
  fileId: string
  title: string
  subtitle?: string
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

interface PlayerApi {
  track: Track | null
  status: PlayerStatus
  /** Start this track, or resume it if it is the paused one */
  play: (track: Track) => void
  /** Pause if this track is playing, otherwise play it */
  toggle: (track: Track) => void
  pause: () => void
  resume: () => void
  seek: (seconds: number) => void
  stop: () => void
}

const PlayerContext = createContext<PlayerApi | null>(null)

export function usePlayer(): PlayerApi {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider')
  return context
}

const describe = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/**
 * One audio element for the whole app, so only one track ever plays at a time.
 * Starting a track anywhere stops the one before it, and a mini player at the
 * bottom of the screen shows what is playing with a seek bar and time.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const requestRef = useRef(0)
  const [track, setTrack] = useState<Track | null>(null)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.addEventListener('timeupdate', () =>
      setCurrentTime(audio.currentTime)
    )
    const syncDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    audio.addEventListener('loadedmetadata', syncDuration)
    audio.addEventListener('durationchange', syncDuration)
    audio.addEventListener('playing', () => setStatus('playing'))
    audio.addEventListener('pause', () => {
      if (!audio.ended && audio.getAttribute('src')) {
        setStatus((s) => (s === 'playing' ? 'paused' : s))
      }
    })
    audio.addEventListener('ended', () => {
      setStatus('paused')
      audio.currentTime = 0
      setCurrentTime(0)
    })
    audio.addEventListener('error', () => {
      if (!audio.getAttribute('src')) return
      setStatus('error')
      setError(
        audio.error?.message ||
          'The browser could not play this file. It may be in a format your browser does not support.'
      )
    })
    audioRef.current = audio
    return audio
  }, [])

  const stop = useCallback(() => {
    requestRef.current++
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setTrack(null)
    setStatus('idle')
    setCurrentTime(0)
    setDuration(0)
    setError(null)
  }, [])

  const play = useCallback(
    async (next: Track) => {
      const audio = getAudio()
      if (track?.fileId === next.fileId && status === 'paused') {
        audio.play().catch((e) => {
          setStatus('error')
          setError(describe(e))
        })
        return
      }

      const request = ++requestRef.current
      audio.pause()
      setTrack(next)
      setStatus('loading')
      setError(null)
      setCurrentTime(0)
      setDuration(0)
      try {
        const url = musicFileUrl(next.fileId)
        if (request !== requestRef.current) return
        audio.src = url
        await audio.play()
      } catch (e) {
        // A newer request replaced this one, which interrupts play(); not an error
        if (request !== requestRef.current) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setStatus('error')
        setError(describe(e))
      }
    },
    [getAudio, track, status]
  )

  const pause = useCallback(() => audioRef.current?.pause(), [])
  const resume = useCallback(() => {
    audioRef.current?.play().catch((e) => {
      setStatus('error')
      setError(describe(e))
    })
  }, [])
  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = seconds
    setCurrentTime(seconds)
  }, [])
  const toggle = useCallback(
    (next: Track) => {
      if (track?.fileId === next.fileId && status === 'playing') pause()
      else play(next)
    },
    [track, status, play, pause]
  )

  // Stop playback when the whole app unmounts
  useEffect(() => stop, [stop])

  const api = useMemo<PlayerApi>(
    () => ({ track, status, play, toggle, pause, resume, seek, stop }),
    [track, status, play, toggle, pause, resume, seek, stop]
  )

  return (
    <PlayerContext.Provider value={api}>
      {children}
      {track && (
        <>
          {/* Keeps the end of the page clear of the fixed player */}
          <div aria-hidden className="h-24 sm:h-16" />
          <div
            role="region"
            aria-label="Music player"
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-4 pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.25)]"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 0.625rem)',
            }}
          >
            <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1.5">
              <Button
                size="icon"
                onClick={() =>
                  status === 'playing'
                    ? pause()
                    : status === 'error'
                      ? play(track)
                      : resume()
                }
                disabled={status === 'loading'}
                aria-label={
                  status === 'playing'
                    ? 'Pause'
                    : status === 'loading'
                      ? 'Loading'
                      : 'Play'
                }
              >
                {status === 'loading' ? (
                  <Loader2 className="animate-spin" />
                ) : status === 'playing' ? (
                  <Pause />
                ) : (
                  <Play />
                )}
              </Button>

              <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
                <p className="truncate font-semibold" title={track.title}>
                  {track.title}
                </p>
                {track.subtitle && (
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={track.subtitle}
                  >
                    {track.subtitle}
                  </p>
                )}
              </div>

              <div className="order-last flex basis-full items-center gap-2 sm:order-none sm:basis-0 sm:flex-1">
                <span className="w-12 text-right font-mono text-xs tabular-nums">
                  {formatDuration(Math.floor(currentTime))}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={Math.min(currentTime, duration || 1)}
                  onChange={(e) => seek(Number(e.target.value))}
                  disabled={!duration}
                  aria-label="Seek"
                  aria-valuetext={`${formatDuration(Math.floor(currentTime))} of ${formatDuration(Math.round(duration))}`}
                  className="h-2 min-w-0 flex-1 cursor-pointer accent-[var(--primary)] disabled:cursor-default"
                />
                <span className="w-12 font-mono text-xs text-muted-foreground tabular-nums">
                  {duration ? formatDuration(Math.round(duration)) : '--:--'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={stop}
                aria-label="Close player"
                title="Close player"
              >
                <X />
              </Button>
            </div>

            {status === 'error' && error && (
              <p
                role="alert"
                className="mx-auto mt-1.5 flex max-w-[1400px] items-start gap-2 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span className="break-words">
                  Could not play this file. {error}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </PlayerContext.Provider>
  )
}
