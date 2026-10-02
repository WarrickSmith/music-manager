import { describe, expect, it } from 'vitest'
import {
  isExportOrder,
  manifestCsv,
  planExport,
  safeName,
  zipFileName,
  type ExportFile,
} from '@/lib/music/export-plan'

const file = (over: Partial<ExportFile>): ExportFile => ({
  $id: 'id',
  fileId: 'f',
  originalName: 'track.mp3',
  gradeType: 'Singles',
  gradeCategory: 'Junior Girls',
  gradeSegment: 'Free Skate',
  userName: 'Mia Kowalski',
  ...over,
})

describe('safeName', () => {
  it('makes text safe for file names', () => {
    expect(safeName('Junior Girls')).toBe('junior-girls')
    expect(safeName("Zoë  O'Brien / Jr.")).toBe('zoe-o-brien-jr')
    expect(safeName('  --  ')).toBe('')
  })
})

describe('planExport', () => {
  const files = [
    file({ $id: '1', gradeCategory: 'Junior Girls', gradeSegment: 'Free Skate', userName: 'Zed', originalName: 'a.WAV' }),
    file({ $id: '2', gradeCategory: 'Junior Girls', gradeSegment: 'Short Program', userName: 'Bea' }),
    file({ $id: '3', gradeCategory: 'Adult Silver', gradeSegment: 'Free Skate', userName: 'Amy', gradeType: 'Adult Singles' }),
  ]

  it('numbers files in running order, padded, keeping the original extension', () => {
    const plan = planExport(files, 'grade')
    expect(plan.map((p) => p.path)).toEqual([
      '001-adult-silver-free-skate-amy.mp3',
      '002-junior-girls-short-program-bea.mp3',
      '003-junior-girls-free-skate-zed.wav',
    ])
    expect(plan.map((p) => p.position)).toEqual([1, 2, 3])
  })

  it('can run all short programs before free skates', () => {
    const plan = planExport(files, 'segment')
    expect(plan.map((p) => p.file.$id)).toEqual(['2', '3', '1'])
  })

  it('widens the padding for very large events', () => {
    const many = Array.from({ length: 1200 }, (_, i) =>
      file({ $id: String(i), userName: `Skater ${String(i).padStart(4, '0')}` })
    )
    const plan = planExport(many, 'grade')
    expect(plan[0].path.startsWith('0001-')).toBe(true)
    expect(plan[1199].path.startsWith('1200-')).toBe(true)
  })

  it('gives every file a unique path even when everything else matches', () => {
    const twins = [file({ $id: 'a' }), file({ $id: 'b' })]
    const paths = planExport(twins, 'grade').map((p) => p.path)
    expect(new Set(paths).size).toBe(2)
  })

  it('falls back to a generic extension', () => {
    const [entry] = planExport([file({ originalName: 'no-extension' })], 'grade')
    expect(entry.path.endsWith('.audio')).toBe(true)
  })
})

describe('manifestCsv', () => {
  it('lists the running order with a header, and quotes awkward text', () => {
    const csv = manifestCsv(
      planExport(
        [
          file({
            userName: 'Smith, Jo "JJ"',
            duration: 212,
            size: 4096,
            uploadedAt: '2026-06-12T10:00:00Z',
          }),
        ],
        'grade'
      )
    )
    const lines = csv.trimEnd().split('\r\n')
    expect(lines[0]).toBe(
      'Order,Grade,Category,Segment,Skater,File in zip,Original file,Length,Size (bytes),Uploaded'
    )
    expect(lines[1]).toContain('"Smith, Jo ""JJ"""')
    expect(lines[1]).toContain(',3:32,4096,2026-06-12T10:00:00Z')
  })

  it('stops spreadsheet formulas in names from running', () => {
    const csv = manifestCsv(planExport([file({ userName: '=HYPERLINK("x")' })], 'grade'))
    expect(csv).toContain('"=HYPERLINK(""x"")"')
  })
})

describe('zipFileName and order check', () => {
  it('names the zip after the competition and order', () => {
    expect(zipFileName('Auckland Winter Cup', 2026, 'segment')).toBe(
      '2026-auckland-winter-cup-music-by-segment.zip'
    )
  })

  it('accepts only the two known orders', () => {
    expect(isExportOrder('grade')).toBe(true)
    expect(isExportOrder('segment')).toBe(true)
    expect(isExportOrder('random')).toBe(false)
    expect(isExportOrder(null)).toBe(false)
  })
})
