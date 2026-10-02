/**
 * A stable, skating-sensible order for grades. Used by the zip export and the
 * entries screen so everything lines up the same way.
 *
 * Order: grade type, then category, then segment (the short or rhythm part of
 * an event before the free part), then skater name.
 */

export interface GradeLike {
  gradeType: string
  gradeCategory: string
  gradeSegment: string
}

const SEGMENT_RANK: Record<string, number> = {
  'pattern dance': 1,
  'rhythm dance': 2,
  'short program': 2,
  'free skate': 3,
  'free dance': 3,
  performance: 3,
}

export function segmentRank(segment: string): number {
  return SEGMENT_RANK[segment.trim().toLowerCase()] ?? 9
}

const text = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

/** Compare two grades: type, category, then segment */
export function compareGrades(a: GradeLike, b: GradeLike): number {
  return (
    text(a.gradeType, b.gradeType) ||
    text(a.gradeCategory, b.gradeCategory) ||
    segmentRank(a.gradeSegment) - segmentRank(b.gradeSegment) ||
    text(a.gradeSegment, b.gradeSegment)
  )
}

/** Compare by segment first (all short programs, then all free skates), then grade */
export function compareBySegment(a: GradeLike, b: GradeLike): number {
  return (
    segmentRank(a.gradeSegment) - segmentRank(b.gradeSegment) ||
    text(a.gradeSegment, b.gradeSegment) ||
    text(a.gradeType, b.gradeType) ||
    text(a.gradeCategory, b.gradeCategory)
  )
}

export type ExportOrder = 'grade' | 'segment'

export function sortForExport<
  T extends GradeLike & { userName: string; uploadedAt?: string },
>(items: T[], order: ExportOrder): T[] {
  const compare = order === 'segment' ? compareBySegment : compareGrades
  // The upload time settles ties so the same data always gives the same order
  return [...items].sort(
    (a, b) =>
      compare(a, b) ||
      text(a.userName, b.userName) ||
      (a.uploadedAt ?? '').localeCompare(b.uploadedAt ?? '')
  )
}
