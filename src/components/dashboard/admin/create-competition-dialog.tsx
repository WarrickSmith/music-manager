'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createCompetition } from '@/app/actions/competition-actions'

interface Competition {
  $id: string
  name: string
  year: number
  active: boolean
}

interface CreateCompetitionDialogProps {
  competitions: Competition[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateCompetitionDialog({
  competitions,
  open,
  onOpenChange,
  onSuccess,
}: CreateCompetitionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    active: true,
    gradeSource: 'default',
    cloneFromCompetitionId: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createCompetition({
        name: formData.name,
        year: formData.year,
        active: formData.active,
        useDefaultGrades: formData.gradeSource === 'default',
        cloneFromCompetitionId:
          formData.gradeSource === 'clone'
            ? formData.cloneFromCompetitionId
            : undefined,
      })

      toast.success('Competition created successfully')
      onSuccess()
    } catch (error) {
      toast.error(`Failed to create competition: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Competition</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <Label htmlFor="competition-name">Competition Name</Label>
              <Input
                id="competition-name"
                placeholder="Enter competition name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="competition-year">Year</Label>
              <Input
                id="competition-year"
                type="number"
                min={2000}
                max={2100}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="competition-active">Active Competition</Label>
            <Switch
              id="competition-active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Grade Source</Label>
            <RadioGroup
              value={formData.gradeSource}
              onValueChange={(value: string) =>
                setFormData({ ...formData, gradeSource: value })
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default-grades" />
                <Label htmlFor="default-grades">Use default grades</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clone" id="clone-grades" />
                <Label htmlFor="clone-grades">
                  Clone from existing competition
                </Label>
              </div>
            </RadioGroup>

            {formData.gradeSource === 'clone' && (
              <div className="pl-6 pt-2">
                <Select
                  value={formData.cloneFromCompetitionId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, cloneFromCompetitionId: value })
                  }
                  required={formData.gradeSource === 'clone'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.$id} value={comp.$id}>
                        {comp.name} ({comp.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Competition'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
