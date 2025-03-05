'use client'
import { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import CompetitionCard from './competition-card'

interface Competition {
  $id: string
  name: string
  year: number
  active: boolean
}

interface CompetitionListProps {
  competitions: Competition[]
  selectedCompetition: Competition | null
  onSelectCompetition: (competition: Competition) => void
  onCompetitionUpdate?: () => void // Add this to allow refreshing from parent
}

export default function CompetitionList({
  competitions,
  selectedCompetition,
  onSelectCompetition,
  onCompetitionUpdate
}: CompetitionListProps) {
  // Get unique years from competitions
  const uniqueYears = useMemo(() => {
    const years = new Set(competitions.map(comp => comp.year));
    return Array.from(years).sort((a, b) => b - a); // Sort years descending
  }, [competitions]);

  // State for year filter
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Filter competitions based on selected year
  const filteredCompetitions = useMemo(() => {
    if (selectedYear === "all") return competitions;
    return competitions.filter(comp => comp.year === parseInt(selectedYear));
  }, [competitions, selectedYear]);

  // Group competitions by year
  const competitionsByYear = useMemo(() => {
    return filteredCompetitions.reduce<Record<number, Competition[]>>(
      (acc, comp) => {
        const year = comp.year;
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(comp);
        return acc;
      },
      {}
    );
  }, [filteredCompetitions]);

  // Sort years descending
  const sortedYears = useMemo(() => {
    return Object.keys(competitionsByYear)
      .map(Number)
      .sort((a, b) => b - a);
  }, [competitionsByYear]);

  // Sort competitions within each year by name ascending
  useMemo(() => {
    sortedYears.forEach((year) => {
      competitionsByYear[year].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [sortedYears, competitionsByYear]);

  return (
    <>
      <div className="mb-4">
        <Label htmlFor="year-filter" className="text-xs text-indigo-600 mb-1 block">
          Filter by Year
        </Label>
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger id="year-filter" className="bg-white border-indigo-100">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="max-h-[calc(100vh-330px)] overflow-auto pr-2">
        <div className="space-y-5">
          {sortedYears.length > 0 ? (
            sortedYears.map((year) => (
              <div key={year}>
                <h3 className="font-medium text-sm text-indigo-500 mb-2">
                  {year}
                </h3>
                <div className="space-y-2">
                  {competitionsByYear[year].map((competition) => (
                    <CompetitionCard
                      key={competition.$id}
                      competition={competition}
                      isSelected={selectedCompetition?.$id === competition.$id}
                      onSelect={() => onSelectCompetition(competition)}
                      onUpdate={onCompetitionUpdate}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-indigo-400">
              No competitions found for the selected year.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
