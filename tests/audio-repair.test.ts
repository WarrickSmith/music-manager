import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  checkPlayable,
  countProblems,
  ffmpegAvailable,
  PROBLEM_THRESHOLD,
  repairToMp3,
} from '@/lib/music/audio-repair'
import { sniffAudio } from '@/lib/music/audio-sniff'

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(new URL(`./fixtures/audio/${name}`, import.meta.url))
  )

const hasFfmpeg = await ffmpegAvailable()

describe('countProblems', () => {
  it('ignores blank lines and the harmless duration note', () => {
    expect(
      countProblems(
        '[mp3 @ 0x1] Estimating duration from bitrate, this may be inaccurate\n\n'
      )
    ).toBe(0)
  })

  it('counts every other line', () => {
    expect(
      countProblems(
        '[mp3float @ 0x1] bits_left=3\n[mp3float @ 0x1] bits_left=2\n'
      )
    ).toBe(2)
  })
})

describe.skipIf(!hasFfmpeg)('with ffmpeg', () => {
  it('passes healthy files in every accepted format', async () => {
    for (const name of ['tone.mp3', 'tone.m4a', 'tone.aac', 'tone.wav']) {
      const result = await checkPlayable(fixture(name))
      expect(result, name).toMatchObject({ checked: true, playable: true })
    }
  })

  it('flags a file a browser would stop playing', async () => {
    const result = await checkPlayable(fixture('damaged.mp3'))
    expect(result.playable).toBe(false)
    expect(result.problems).toBeGreaterThanOrEqual(PROBLEM_THRESHOLD)
  })

  it('repairs it into a clean MP3 of the same length', async () => {
    const fixed = await repairToMp3(fixture('damaged.mp3'))
    const audio = await sniffAudio(fixed)
    expect(audio.kind).toBe('mp3')
    expect(audio.durationSeconds).toBeGreaterThanOrEqual(1)
    expect(await checkPlayable(fixed)).toMatchObject({
      playable: true,
      problems: 0,
    })
  })

  it('refuses to repair something that is not audio', async () => {
    await expect(
      repairToMp3(new TextEncoder().encode('<html></html>'))
    ).rejects.toThrow(/could not repair/i)
  })
})
