/**
 * How much silence a track starts with. Rink operators start the music on a
 * cue, so clubs usually ask skaters to leave about a second of silence at the
 * start. This is advice only: the upload is never blocked.
 */

/** About -46 dB. Quieter than this counts as silence. */
export const SILENCE_THRESHOLD = 0.005

/** Below this the start is too abrupt to cue */
export const MIN_GOOD_SILENCE_SECONDS = 0.75

/** Above this the track probably has dead air at the start */
export const MAX_GOOD_SILENCE_SECONDS = 5

/** Only the opening is scanned; a track that stays quiet this long is reported as this long */
const SCAN_SECONDS = 15

/**
 * Seconds from the start until any channel first rises above the threshold.
 * Returns the scanned length when the opening is silent throughout.
 */
export function leadingSilenceSeconds(
  channels: ArrayLike<number>[],
  sampleRate: number,
  threshold: number = SILENCE_THRESHOLD
): number {
  if (channels.length === 0 || sampleRate <= 0) return 0
  const length = Math.min(
    ...channels.map((c) => c.length),
    Math.floor(sampleRate * SCAN_SECONDS)
  )
  for (let i = 0; i < length; i++) {
    for (const channel of channels) {
      if (Math.abs(channel[i]) > threshold) return i / sampleRate
    }
  }
  return length / sampleRate
}

export type SilenceVerdict = 'good' | 'too-short' | 'too-long'

export function silenceVerdict(seconds: number): SilenceVerdict {
  if (seconds < MIN_GOOD_SILENCE_SECONDS) return 'too-short'
  if (seconds > MAX_GOOD_SILENCE_SECONDS) return 'too-long'
  return 'good'
}

/**
 * Decode the file in the browser and measure its leading silence. Returns null
 * when the browser cannot decode the format, so callers just skip the advice.
 */
export async function analyseLeadingSilence(
  file: File
): Promise<number | null> {
  const Context =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined
  if (!Context) return null

  const context = new Context()
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer())
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
      buffer.getChannelData(i)
    )
    return leadingSilenceSeconds(channels, buffer.sampleRate)
  } catch (error) {
    console.error('Could not measure the silence at the start:', error)
    return null
  } finally {
    context.close().catch(() => {})
  }
}
