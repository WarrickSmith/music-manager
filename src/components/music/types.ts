/** A music file record as returned by the music file actions */
export interface MusicFile {
  $id: string
  fileId: string
  originalName: string
  fileName: string
  storagePath: string
  competitionId: string
  competitionName: string
  competitionYear: number
  gradeId: string
  gradeType: string
  gradeCategory: string
  gradeSegment: string
  userId: string
  userName: string
  uploadedAt: string
  duration?: number | null
  size: number
  status: string
}

export interface MusicFilters {
  search: string
  year: string
  competition: string
  grade: string
  category: string
  segment: string
  competitor: string
}

export const EMPTY_FILTERS: MusicFilters = {
  search: '',
  year: 'all',
  competition: 'all',
  grade: 'all',
  category: 'all',
  segment: 'all',
  competitor: 'all',
}

/** The storage file id, taken from the record or from its storage path */
export function storageFileId(file: MusicFile): string {
  return file.fileId || file.storagePath?.split('/').pop() || ''
}
