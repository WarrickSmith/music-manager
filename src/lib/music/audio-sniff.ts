import * as musicMetadata from 'music-metadata'

/**
 * Work out what an uploaded file really is from its bytes, instead of
 * trusting the file name or the type the browser reported. Anyone can send a
 * file called song.mp3 that is really a web page, so the server checks.
 */

export type AudioKind = 'mp3' | 'wav' | 'm4a' | 'aac'

export interface SniffedAudio {
  kind: AudioKind
  /** File extension to store the file under, from the content not the name */
  extension: string
  /** The type to store and serve the file as */
  mimeType: string
  /** Length in whole seconds; null when the format does not say (raw AAC) */
  durationSeconds: number | null
}

/** Thrown with a message that is safe to show to the person uploading */
export class NotAudioError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotAudioError'
  }
}

const KINDS: Record<AudioKind, { extension: string; mimeType: string }> = {
  mp3: { extension: 'mp3', mimeType: 'audio/mpeg' },
  wav: { extension: 'wav', mimeType: 'audio/wav' },
  m4a: { extension: 'm4a', mimeType: 'audio/mp4' },
  aac: { extension: 'aac', mimeType: 'audio/aac' },
}

const ACCEPTED_TEXT = 'MP3, WAV, M4A or AAC'

const AUDIO_CODEC = /aac|alac|mp3|mpeg-1|mpeg-2|ac-?3|opus|flac|pcm|amr|vorbis/i
const VIDEO_BRAND = /avc1|hvc1|hev1|av01|vp09/i

/**
 * MP4 files can carry video. music-metadata lists every track, and video
 * tracks come through with a codec name that is not an audio codec.
 */
function looksLikeVideo(
  container: string,
  tracks: { codecName?: string }[] | undefined
): boolean {
  if (VIDEO_BRAND.test(container)) return true
  return (
    tracks?.some(
      (track) => track.codecName && !AUDIO_CODEC.test(track.codecName)
    ) ?? false
  )
}

/** The parts of music-metadata's result that the check uses */
export interface FormatInfo {
  container?: string
  codec?: string
  duration?: number
  trackInfo?: { codecName?: string }[]
}

/**
 * Decide whether parsed metadata describes an accepted audio file.
 * Exported separately so the rules can be tested without audio files.
 */
export function classifyAudio(format: FormatInfo): SniffedAudio {
  const container = format.container ?? ''
  const codec = format.codec ?? ''
  const duration =
    format.duration && format.duration > 0 ? Math.round(format.duration) : null

  let kind: AudioKind | null = null
  if (container === 'MPEG' && /layer/i.test(codec)) kind = 'mp3'
  else if (container === 'WAVE') kind = 'wav'
  else if (container.startsWith('ADTS') && /aac/i.test(codec)) kind = 'aac'
  else if (/^(M4A|M4B|isom|iso2|mp4[12]|mp41|mp42)/i.test(container)) {
    kind = 'm4a'
    // A video file in an MP4 wrapper is not music
    if (looksLikeVideo(container, format.trackInfo)) {
      throw new NotAudioError(
        `This is a video file. Please upload audio only (${ACCEPTED_TEXT}).`
      )
    }
  }

  if (!kind) {
    throw new NotAudioError(
      `This does not look like an audio file we accept. Please upload ${ACCEPTED_TEXT}.`
    )
  }

  // A header with no readable audio is a damaged or cut-off file
  if (kind !== 'aac' && (!codec || duration === null)) {
    throw new NotAudioError(
      'This audio file looks damaged or incomplete, so it could not be read. Please export it again and retry.'
    )
  }

  return { kind, ...KINDS[kind], durationSeconds: duration }
}

export async function sniffAudio(bytes: Uint8Array): Promise<SniffedAudio> {
  if (bytes.byteLength === 0) {
    throw new NotAudioError('This file is empty.')
  }
  let format: FormatInfo
  try {
    format = (await musicMetadata.parseBuffer(bytes)).format
  } catch {
    throw new NotAudioError(
      `This does not look like an audio file we accept. Please upload ${ACCEPTED_TEXT}.`
    )
  }
  return classifyAudio(format)
}
