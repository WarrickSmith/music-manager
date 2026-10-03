'use client'

import { RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { MusicFilters } from './types'

interface Options {
  years: string[]
  competitions: string[]
  grades: string[]
  categories: string[]
  segments: string[]
  competitors: string[]
}

function FilterSelect({
  label,
  allLabel,
  value,
  values,
  onChange,
}: {
  label: string
  allLabel: string
  value: string
  values: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">{allLabel}</SelectItem>
        {values.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * One filter toolbar for both roles. Admins get the extra Competitor filter;
 * everything else is identical so the screens behave the same.
 */
export default function MusicFilterBar({
  filters,
  options,
  onChange,
  onReset,
  isFiltered,
  showCompetitor,
}: {
  filters: MusicFilters
  options: Options
  onChange: (key: keyof MusicFilters, value: string) => void
  onReset: () => void
  isFiltered: boolean
  showCompetitor: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Search music files"
          placeholder={
            showCompetitor
              ? 'Search file, competitor or competition'
              : 'Search file name or competition'
          }
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          className="pl-9"
        />
      </div>
      <FilterSelect
        label="Year"
        allLabel="All years"
        value={filters.year}
        values={options.years}
        onChange={(v) => onChange('year', v)}
      />
      <FilterSelect
        label="Competition"
        allLabel="All competitions"
        value={filters.competition}
        values={options.competitions}
        onChange={(v) => onChange('competition', v)}
      />
      <FilterSelect
        label="Grade"
        allLabel="All grades"
        value={filters.grade}
        values={options.grades}
        onChange={(v) => onChange('grade', v)}
      />
      <FilterSelect
        label="Category"
        allLabel="All categories"
        value={filters.category}
        values={options.categories}
        onChange={(v) => onChange('category', v)}
      />
      <FilterSelect
        label="Segment"
        allLabel="All segments"
        value={filters.segment}
        values={options.segments}
        onChange={(v) => onChange('segment', v)}
      />
      {showCompetitor && (
        <FilterSelect
          label="Competitor"
          allLabel="All competitors"
          value={filters.competitor}
          values={options.competitors}
          onChange={(v) => onChange('competitor', v)}
        />
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={!isFiltered}
        className="w-full"
      >
        <RotateCcw className="size-4" aria-hidden />
        Reset filters
      </Button>
    </div>
  )
}
