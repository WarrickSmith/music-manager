import { describe, expect, it } from 'vitest'
import {
  leadingSilenceSeconds,
  silenceVerdict,
} from '@/lib/audio/leading-silence'

const rate = 1000

/** A mono signal: silence for `quiet` seconds, then a loud tone */
function track(quiet: number, loud = 2, level = 0.5) {
  const out = new Float32Array((quiet + loud) * rate)
  for (let i = Math.round(quiet * rate); i < out.length; i++) out[i] = level
  return out
}

describe('leadingSilenceSeconds', () => {
  it('measures the silence before the first sound', () => {
    expect(leadingSilenceSeconds([track(1)], rate)).toBeCloseTo(1, 2)
    expect(leadingSilenceSeconds([track(0)], rate)).toBe(0)
    expect(leadingSilenceSeconds([track(2.5)], rate)).toBeCloseTo(2.5, 2)
  })

  it('ignores a noise floor below the threshold', () => {
    const noisy = track(1)
    for (let i = 0; i < 1000; i++) noisy[i] = 0.001
    expect(leadingSilenceSeconds([noisy], rate)).toBeCloseTo(1, 2)
  })

  it('uses whichever channel makes sound first', () => {
    expect(leadingSilenceSeconds([track(2), track(0.5)], rate)).toBeCloseTo(
      0.5,
      2
    )
  })

  it('stops scanning after the opening seconds for a silent track', () => {
    expect(leadingSilenceSeconds([new Float32Array(60 * rate)], rate)).toBe(15)
  })

  it('handles empty input', () => {
    expect(leadingSilenceSeconds([], rate)).toBe(0)
    expect(leadingSilenceSeconds([new Float32Array(0)], rate)).toBe(0)
  })
})

describe('silenceVerdict', () => {
  it('flags starts that are too abrupt or too long', () => {
    expect(silenceVerdict(0)).toBe('too-short')
    expect(silenceVerdict(0.5)).toBe('too-short')
    expect(silenceVerdict(0.75)).toBe('good')
    expect(silenceVerdict(1.2)).toBe('good')
    expect(silenceVerdict(5)).toBe('good')
    expect(silenceVerdict(6)).toBe('too-long')
  })
})
