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
import { RefreshCw } from 'lucide-react'
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
      <DialogContent className="sm:max-w-[500px] border-indigo-100">
        <DialogHeader>
          <DialogTitle className="text-indigo-700 text-xl font-semibold">
            Create New Competition
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <Label
                htmlFor="competition-name"
                className="text-indigo-700 font-medium"
              >
                Competition Name
              </Label>
              <Input
                id="competition-name"
                placeholder="Enter competition name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
              />
            </div>

            <div>
              <Label
                htmlFor="competition-year"
                className="text-indigo-700 font-medium"
              >
                Year
              </Label>
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
                className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="competition-active"
              className="text-indigo-700 font-medium"
            >
              Active Competition
            </Label>
            <Switch
              id="competition-active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-indigo-700 font-medium">Grade Source</Label>
            <RadioGroup
              value={formData.gradeSource}
              onValueChange={(value: string) =>
                setFormData({ ...formData, gradeSource: value })
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="default"
                  id="default-grades"
                  className="border-indigo-400 text-indigo-600"
                />
                <Label htmlFor="default-grades" className="text-indigo-600">
                  Use default grades
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="clone"
                  id="clone-grades"
                  className="border-indigo-400 text-indigo-600"
                />
                <Label htmlFor="clone-grades" className="text-indigo-600">
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
                  <SelectTrigger className="border-indigo-200 text-indigo-700">
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((comp) => (
                      <SelectItem
                        key={comp.$id}
                        value={comp.$id}
                        className="text-indigo-700"
                      >
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
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Creating</span>
                </>
              ) : (
                'Create Competition'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
