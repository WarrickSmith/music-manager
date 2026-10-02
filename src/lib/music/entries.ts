import { compareGrades } from './grade-order'

export interface Entry {
  $id: string
  competitionId: string
  gradeId: string
  userId: string
  userName: string
}

export interface GradeInfo {
  $id: string
  name: string
  category: string
  segment: string
}

export interface FileInfo {
  $id: string
  userId: string
  gradeId: string
  uploadedAt?: string
  duration?: number | null
}

export interface EntryStatus {
  entry: Entry
  grade: GradeInfo | undefined
  file: FileInfo | undefined
  /** True when the skater has uploaded music for this grade */
  received: boolean
}

/** Pair each entry with the music its skater uploaded for that grade, if any */
export function matchEntries(
  entries: Entry[],
  grades: GradeInfo[],
  files: FileInfo[],
): EntryStatus[] {
  const gradeById = new Map(grades.map((g) => [g.$id, g]))
  // Newest upload wins if there is somehow more than one for a skater and grade
  const fileByKey = new Map<string, FileInfo>()
  for (const file of files) {
    const key = `${file.userId}|${file.gradeId}`
    const current = fileByKey.get(key)
    if (!current || (file.uploadedAt ?? '') > (current.uploadedAt ?? '')) {
      fileByKey.set(key, file)
    }
  }
  return entries.map((entry) => {
    const file = fileByKey.get(`${entry.userId}|${entry.gradeId}`)
    return {
      entry,
      grade: gradeById.get(entry.gradeId),
      file,
      received: !!file,
    }
  })
}

export function summarise(statuses: EntryStatus[]) {
  const received = statuses.filter((s) => s.received).length
  return {
    total: statuses.length,
    received,
    missing: statuses.length - received,
  }
}

export interface GradeGroup {
  gradeId: string
  grade: GradeInfo | undefined
  items: EntryStatus[]
}

const asGradeLike = (g: GradeInfo | undefined) => ({
  gradeType: g?.name ?? '',
  gradeCategory: g?.category ?? '',
  gradeSegment: g?.segment ?? '',
})

/** Group entries by grade in skating order, skaters A to Z within each grade */
export function groupByGrade(statuses: EntryStatus[]): GradeGroup[] {
  const groups = new Map<string, GradeGroup>()
  for (const status of statuses) {
    const id = status.entry.gradeId
    if (!groups.has(id)) {
      groups.set(id, { gradeId: id, grade: status.grade, items: [] })
    }
    groups.get(id)!.items.push(status)
  }
  const list = [...groups.values()]
  for (const group of list) {
    group.items.sort((a, b) =>
      a.entry.userName.localeCompare(b.entry.userName, undefined, {
        sensitivity: 'base',
      }),
    )
  }
  return list.sort((a, b) =>
    compareGrades(asGradeLike(a.grade), asGradeLike(b.grade)),
  )
}

export function gradeLabel(grade: GradeInfo | undefined): string {
  return grade
    ? `${grade.name} · ${grade.category} · ${grade.segment}`
    : 'Unknown grade'
}

/**
 * Plain text list of who still needs to upload, grouped by grade, ready to
 * paste into a message or email.
 */
export function missingListText(
  statuses: EntryStatus[],
  competitionLabel: string,
): string {
  const missing = statuses.filter((s) => !s.received)
  if (missing.length === 0) {
    return `${competitionLabel}: every entered skater has uploaded their music.`
  }
  const lines = [`${competitionLabel}: music still needed (${missing.length})`]
  for (const group of groupByGrade(missing)) {
    lines.push('', gradeLabel(group.grade))
    for (const item of group.items) lines.push(`  ${item.entry.userName}`)
  }
  return lines.join('\n')
}
