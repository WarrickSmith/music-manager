'use client'

// No need for ScrollArea as we're using native overflow
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
}

export default function CompetitionList({
  competitions,
  selectedCompetition,
  onSelectCompetition,
}: CompetitionListProps) {
  // Group competitions by year
  const competitionsByYear = competitions.reduce<Record<number, Competition[]>>(
    (acc, comp) => {
      const year = comp.year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(comp)
      return acc
    },
    {}
  )

  // Sort years descending
  const sortedYears = Object.keys(competitionsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  // Sort competitions within each year by name ascending
  sortedYears.forEach((year) => {
    competitionsByYear[year].sort((a, b) => a.name.localeCompare(b.name))
  })

  return (
    <div className="max-h-[calc(100vh-280px)] overflow-auto pr-2">
      <div className="space-y-5">
        {sortedYears.map((year) => (
          <div key={year}>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              {year}
            </h3>
            <div className="space-y-2">
              {competitionsByYear[year].map((competition) => (
                <CompetitionCard
                  key={competition.$id}
                  competition={competition}
                  isSelected={selectedCompetition?.$id === competition.$id}
                  onSelect={() => onSelectCompetition(competition)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
