import { useMemo, useState } from 'react'
import { EMPTY_FILTERS, type MusicFile, type MusicFilters } from './types'

const unique = (values: (string | number | undefined | null)[]) =>
  [...new Set(values.map((v) => (v == null ? '' : String(v))))].filter(Boolean)

/**
 * Filter state and the filtered list, shared by the competitor and admin
 * music screens so both filter in exactly the same way.
 */
export function useMusicFilters(files: MusicFile[]) {
  const [filters, setFilters] = useState<MusicFilters>(EMPTY_FILTERS)

  const options = useMemo(
    () => ({
      years: unique(files.map((f) => f.competitionYear)).sort((a, b) =>
        b.localeCompare(a),
      ),
      competitions: unique(files.map((f) => f.competitionName)).sort(),
      grades: unique(files.map((f) => f.gradeType)).sort(),
      categories: unique(files.map((f) => f.gradeCategory)).sort(),
      segments: unique(files.map((f) => f.gradeSegment)).sort(),
      competitors: unique(files.map((f) => f.userName)).sort(),
    }),
    [files],
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return files.filter((file) => {
      if (
        filters.year !== 'all' &&
        String(file.competitionYear) !== filters.year
      )
        return false
      if (
        filters.competition !== 'all' &&
        file.competitionName !== filters.competition
      )
        return false
      if (filters.grade !== 'all' && file.gradeType !== filters.grade)
        return false
      if (filters.category !== 'all' && file.gradeCategory !== filters.category)
        return false
      if (filters.segment !== 'all' && file.gradeSegment !== filters.segment)
        return false
      if (filters.competitor !== 'all' && file.userName !== filters.competitor)
        return false
      if (search) {
        return [
          file.fileName,
          file.originalName,
          file.userName,
          file.competitionName,
          file.gradeCategory,
        ].some((field) => field?.toLowerCase().includes(search))
      }
      return true
    })
  }, [files, filters])

  const isFiltered = Object.entries(filters).some(
    ([key, value]) => value !== EMPTY_FILTERS[key as keyof MusicFilters],
  )

  return {
    filters,
    setFilter: (key: keyof MusicFilters, value: string) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    reset: () => setFilters(EMPTY_FILTERS),
    options,
    filtered,
    isFiltered,
  }
}
