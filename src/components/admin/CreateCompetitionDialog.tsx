'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Competition } from '@/types/competition'

interface CreateCompetitionDialogProps {
  open: boolean
  onClose: () => void
  competitions: Competition[]
  onCreateCompetition: (data: {
    name: string
    year: number
    sourceCompetitionId?: string
  }) => void
}

export function CreateCompetitionDialog({
  open,
  onClose,
  competitions,
  onCreateCompetition,
}: CreateCompetitionDialogProps) {
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [useDefaultGrades, setUseDefaultGrades] = useState(true)
  const [sourceCompetitionId, setSourceCompetitionId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateCompetition({
      name,
      year,
      sourceCompetitionId: useDefaultGrades ? undefined : sourceCompetitionId,
    })
    // Reset form
    setName('')
    setYear(new Date().getFullYear())
    setUseDefaultGrades(true)
    setSourceCompetitionId('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Competition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Competition Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter competition name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2000}
              max={2100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Grades Setup</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={useDefaultGrades ? 'default' : 'outline'}
                onClick={() => setUseDefaultGrades(true)}
                className="w-full"
              >
                Use Default Grades
              </Button>
              <Button
                type="button"
                variant={!useDefaultGrades ? 'default' : 'outline'}
                onClick={() => setUseDefaultGrades(false)}
                className="w-full"
              >
                Clone from Existing
              </Button>
            </div>
          </div>
          {!useDefaultGrades && (
            <div className="space-y-2">
              <Label htmlFor="sourceCompetition">Source Competition</Label>
              <select
                id="sourceCompetition"
                value={sourceCompetitionId}
                onChange={(e) => setSourceCompetitionId(e.target.value)}
                className="w-full border rounded-md h-9 px-3"
                required
              >
                <option value="">Select a competition</option>
                {competitions.map((competition) => (
                  <option key={competition.$id} value={competition.$id}>
                    {competition.name} ({competition.year})
                  </option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Competition</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
