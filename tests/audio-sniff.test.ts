import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  classifyAudio,
  NotAudioError,
  sniffAudio,
} from '@/lib/music/audio-sniff'

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(new URL(`./fixtures/audio/${name}`, import.meta.url))
  )

describe('sniffAudio: real files', () => {
  it.each([
    ['tone.mp3', 'mp3', 'audio/mpeg'],
    ['tone.wav', 'wav', 'audio/wav'],
    ['tone.m4a', 'm4a', 'audio/mp4'],
    ['tone.aac', 'aac', 'audio/aac'],
  ])('accepts %s from its content', async (file, kind, mime) => {
    const result = await sniffAudio(fixture(file))
    expect(result.kind).toBe(kind)
    expect(result.extension).toBe(kind)
    expect(result.mimeType).toBe(mime)
  })

  it('reads the length from the file itself', async () => {
    expect((await sniffAudio(fixture('tone.mp3'))).durationSeconds).toBe(1)
    expect((await sniffAudio(fixture('tone.wav'))).durationSeconds).toBe(1)
    expect((await sniffAudio(fixture('tone.m4a'))).durationSeconds).toBe(1)
  })

  it('accepts raw AAC even though it has no stored length', async () => {
    expect((await sniffAudio(fixture('tone.aac'))).durationSeconds).toBeNull()
  })

  it.each([
    ['fake.html', /does not look like an audio file/],
    ['empty.mp3', /empty/],
    ['truncated.wav', /damaged or incomplete/],
    ['video.mp4', /video file/],
    ['tone.ogg', /does not look like an audio file we accept/],
    ['tone.flac', /does not look like an audio file we accept/],
  ])('rejects %s', async (file, message) => {
    const error = await sniffAudio(fixture(file)).catch((e) => e)
    expect(error).toBeInstanceOf(NotAudioError)
    expect(error.message).toMatch(message)
  })

  it('rejects random bytes with an audio-looking name', async () => {
    const random = new Uint8Array(5000).map((_, i) => (i * 7919) % 251)
    await expect(sniffAudio(random)).rejects.toBeInstanceOf(NotAudioError)
  })
})

describe('classifyAudio', () => {
  it('needs the MPEG codec to be an MP3 layer', () => {
    expect(() =>
      classifyAudio({ container: 'MPEG', codec: 'something', duration: 3 })
    ).toThrow(NotAudioError)
  })

  it('rounds the length and treats zero as unreadable', () => {
    expect(
      classifyAudio({ container: 'WAVE', codec: 'PCM', duration: 2.6 })
        .durationSeconds
    ).toBe(3)
    expect(() =>
      classifyAudio({ container: 'WAVE', codec: 'PCM', duration: 0 })
    ).toThrow(/damaged/)
  })

  it('accepts MP4-family audio and refuses it with a video track', () => {
    const audio = { container: 'isom/iso2', codec: 'MPEG-4/AAC', duration: 2 }
    expect(classifyAudio(audio).kind).toBe('m4a')
    expect(() =>
      classifyAudio({ ...audio, trackInfo: [{ codecName: '<mp4v>' }] })
    ).toThrow(/video/)
    expect(() =>
      classifyAudio({
        container: 'isom/avc1',
        codec: 'MPEG-4/AAC',
        duration: 2,
      })
    ).toThrow(/video/)
    expect(
      classifyAudio({ ...audio, trackInfo: [{ codecName: 'MPEG-4/AAC' }] }).kind
    ).toBe('m4a')
  })
})
