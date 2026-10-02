import { describe, expect, it } from 'vitest'
import {
  groupByGrade,
  matchEntries,
  missingListText,
  summarise,
  type Entry,
  type FileInfo,
  type GradeInfo,
} from '@/lib/music/entries'
import {
  compareGrades,
  segmentRank,
  sortForExport,
} from '@/lib/music/grade-order'

const grades: GradeInfo[] = [
  { $id: 'g1', name: 'Singles', category: 'Junior Girls', segment: 'Free Skate' },
  { $id: 'g2', name: 'Singles', category: 'Junior Girls', segment: 'Short Program' },
  { $id: 'g3', name: 'Ice Dance', category: 'Junior', segment: 'Free Dance' },
]
const entry = (id: string, gradeId: string, userId: string, userName: string): Entry => ({
  $id: id, competitionId: 'c1', gradeId, userId, userName,
})
const entries = [
  entry('e1', 'g1', 'u1', 'Mia Kowalski'),
  entry('e2', 'g2', 'u1', 'Mia Kowalski'),
  entry('e3', 'g1', 'u2', 'Anna Lee'),
  entry('e4', 'g3', 'u2', 'Anna Lee'),
]
const files: FileInfo[] = [
  { $id: 'f1', userId: 'u1', gradeId: 'g1', uploadedAt: '2026-06-01T00:00:00Z' },
  { $id: 'f2', userId: 'u2', gradeId: 'g3' },
]

describe('matchEntries', () => {
  it('marks an entry received only when that skater uploaded for that grade', () => {
    const statuses = matchEntries(entries, grades, files)
    expect(statuses.map((s) => [s.entry.$id, s.received])).toEqual([
      ['e1', true],
      ['e2', false],
      ['e3', false],
      ['e4', true],
    ])
    expect(statuses[0].grade?.category).toBe('Junior Girls')
  })

  it('does not count another skater\'s file for the same grade', () => {
    const statuses = matchEntries(entries, grades, files)
    expect(statuses.find((s) => s.entry.$id === 'e3')?.received).toBe(false)
  })

  it('keeps the newest upload when a skater somehow has two', () => {
    const statuses = matchEntries(entries.slice(0, 1), grades, [
      { $id: 'old', userId: 'u1', gradeId: 'g1', uploadedAt: '2026-01-01T00:00:00Z' },
      { $id: 'new', userId: 'u1', gradeId: 'g1', uploadedAt: '2026-06-01T00:00:00Z' },
    ])
    expect(statuses[0].file?.$id).toBe('new')
  })

  it('copes with an entry whose grade was deleted', () => {
    const [status] = matchEntries([entry('x', 'gone', 'u1', 'Mia')], grades, [])
    expect(status.grade).toBeUndefined()
    expect(status.received).toBe(false)
  })
})

describe('summarise', () => {
  it('counts received and missing', () => {
    expect(summarise(matchEntries(entries, grades, files))).toEqual({
      total: 4,
      received: 2,
      missing: 2,
    })
  })
})

describe('groupByGrade', () => {
  it('orders grades by type, category and segment, and skaters A to Z', () => {
    const groups = groupByGrade(matchEntries(entries, grades, files))
    expect(groups.map((g) => g.gradeId)).toEqual(['g3', 'g2', 'g1'])
    expect(groups[2].items.map((i) => i.entry.userName)).toEqual([
      'Anna Lee',
      'Mia Kowalski',
    ])
  })
})

describe('missingListText', () => {
  it('lists only skaters whose music is missing, grouped by grade', () => {
    const text = missingListText(
      matchEntries(entries, grades, files),
      '2026 Winter Cup'
    )
    expect(text).toContain('2026 Winter Cup: music still needed (2)')
    expect(text).toContain('Singles · Junior Girls · Short Program\n  Mia Kowalski')
    expect(text).toContain('Singles · Junior Girls · Free Skate\n  Anna Lee')
    expect(text).not.toContain('Ice Dance')
  })

  it('says so when nothing is missing', () => {
    const all = matchEntries(entries.slice(0, 1), grades, files)
    expect(missingListText(all, 'Cup')).toBe(
      'Cup: every entered skater has uploaded their music.'
    )
  })
})

describe('grade order', () => {
  it('puts the short or rhythm part of an event before the free part', () => {
    expect(segmentRank('Short Program')).toBeLessThan(segmentRank('Free Skate'))
    expect(segmentRank('Rhythm Dance')).toBeLessThan(segmentRank('Free Dance'))
    expect(segmentRank('Pattern Dance')).toBeLessThan(segmentRank('Rhythm Dance'))
    expect(segmentRank('Something else')).toBeGreaterThan(segmentRank('Free Skate'))
  })

  it('sorts by type, then category, then segment', () => {
    const rows = [
      { gradeType: 'Singles', gradeCategory: 'B', gradeSegment: 'Free Skate' },
      { gradeType: 'Singles', gradeCategory: 'A', gradeSegment: 'Free Skate' },
      { gradeType: 'Singles', gradeCategory: 'A', gradeSegment: 'Short Program' },
      { gradeType: 'Adult Singles', gradeCategory: 'Z', gradeSegment: 'Free Skate' },
    ]
    expect([...rows].sort(compareGrades).map((r) => `${r.gradeType}/${r.gradeCategory}/${r.gradeSegment}`)).toEqual([
      'Adult Singles/Z/Free Skate',
      'Singles/A/Short Program',
      'Singles/A/Free Skate',
      'Singles/B/Free Skate',
    ])
  })

  it('can order the export by segment first, then grade, then skater', () => {
    const rows = [
      { gradeType: 'Singles', gradeCategory: 'A', gradeSegment: 'Free Skate', userName: 'Zed' },
      { gradeType: 'Singles', gradeCategory: 'A', gradeSegment: 'Short Program', userName: 'Bea' },
      { gradeType: 'Singles', gradeCategory: 'B', gradeSegment: 'Short Program', userName: 'Amy' },
      { gradeType: 'Singles', gradeCategory: 'A', gradeSegment: 'Short Program', userName: 'Abe' },
    ]
    expect(sortForExport(rows, 'segment').map((r) => r.userName)).toEqual([
      'Abe', 'Bea', 'Amy', 'Zed',
    ])
    expect(sortForExport(rows, 'grade').map((r) => r.userName)).toEqual([
      'Abe', 'Bea', 'Zed', 'Amy',
    ])
  })
})
