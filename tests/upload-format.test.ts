import { describe, expect, it } from 'vitest'
import { formatBytes, formatSpeed, formatTimeLeft } from '@/lib/upload/format'

describe('upload format helpers', () => {
  it('shows small files in KB and larger files in MB', () => {
    expect(formatBytes(48 * 1024)).toBe('48 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(4.8 * 1024 * 1024)).toBe('4.8 MB')
  })

  it('formats speed with a per-second unit', () => {
    expect(formatSpeed(1.7 * 1024 * 1024)).toBe('1.7 MB/s')
    expect(formatSpeed(300 * 1024)).toBe('300 KB/s')
  })

  it('estimates time left, or waits until there is a speed', () => {
    expect(formatTimeLeft(0, 100, 0)).toBe('calculating')
    expect(formatTimeLeft(50, 100, 10)).toBe('about 5 s left')
    expect(formatTimeLeft(0, 6000, 10)).toBe('about 10 min left')
    expect(formatTimeLeft(100, 100, 10)).toBe('calculating')
  })
})
