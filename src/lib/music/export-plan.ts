import { sortForExport, type ExportOrder } from './grade-order'

export type { ExportOrder }

/** The music file fields the export needs */
export interface ExportFile {
  $id: string
  fileId: string
  originalName: string
  gradeType: string
  gradeCategory: string
  gradeSegment: string
  userName: string
  uploadedAt?: string
  duration?: number | null
  size?: number
}

export interface PlannedEntry {
  /** 1-based place in the running order */
  position: number
  /** Path inside the zip, e.g. 004-junior-girls-free-skate-mia-kowalski.mp3 */
  path: string
  file: ExportFile
}

/** Lower-case, hyphen-separated text that is safe in a file name */
export function safeName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function extensionOf(originalName: string): string {
  const match = /\.([a-zA-Z0-9]{1,5})$/.exec(originalName)
  return match ? `.${match[1].toLowerCase()}` : '.audio'
}

/**
 * Put the files in running order and give each a numbered name, so the zip
 * sorts the way the event runs. Numbers are padded so 10 sorts after 9.
 */
export function planExport(
  files: ExportFile[],
  order: ExportOrder
): PlannedEntry[] {
  const sorted = sortForExport(files, order)
  const width = Math.max(3, String(sorted.length).length)
  return sorted.map((file, index) => {
    const position = index + 1
    const name = [file.gradeCategory, file.gradeSegment, file.userName]
      .map(safeName)
      .filter(Boolean)
      .join('-')
    return {
      position,
      path: `${String(position).padStart(width, '0')}-${name}${extensionOf(file.originalName)}`,
      file,
    }
  })
}

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value)
  // Quote anything that could break the row or be read as a formula
  return /[",\r\n]/.test(text) || /^[=+\-@]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text
}

function clock(seconds: number | null | undefined): string {
  if (!seconds) return ''
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** A spreadsheet of the running order, included in the zip as manifest.csv */
export function manifestCsv(entries: PlannedEntry[]): string {
  const rows = [
    [
      'Order',
      'Grade',
      'Category',
      'Segment',
      'Skater',
      'File in zip',
      'Original file',
      'Length',
      'Size (bytes)',
      'Uploaded',
    ],
    ...entries.map(({ position, path, file }) => [
      position,
      file.gradeType,
      file.gradeCategory,
      file.gradeSegment,
      file.userName,
      path,
      file.originalName,
      clock(file.duration),
      file.size ?? '',
      file.uploadedAt ?? '',
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function zipFileName(
  competitionName: string,
  year: number,
  order: ExportOrder
): string {
  return `${year}-${safeName(competitionName)}-music-by-${order}.zip`
}

export function isExportOrder(value: string | null): value is ExportOrder {
  return value === 'grade' || value === 'segment'
}
