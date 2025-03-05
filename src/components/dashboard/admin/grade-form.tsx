'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGrade, updateGrade } from '@/app/actions/grade-actions'

const CATEGORIES = ['Junior', 'Senior', 'Intermediate', 'Novice', 'Adult']
const SEGMENTS = ['Solo', 'Pair', 'Group', 'Dance', 'Free']

interface GradeFormProps {
  competitionId: string
  grade?: {
    $id: string
    name: string
    category: string
    segment: string
  } | null
  onSuccess: () => void
}

export default function GradeForm({
  competitionId,
  grade = null,
  onSuccess,
}: GradeFormProps) {
  const [formData, setFormData] = useState({
    name: grade?.name || '',
    category: grade?.category || '',
    segment: grade?.segment || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (grade) {
        // Update existing grade
        await updateGrade(grade.$id, {
          name: formData.name,
          category: formData.category,
          segment: formData.segment,
        })
      } else {
        // Create new grade
        await createGrade({
          name: formData.name,
          category: formData.category,
          segment: formData.segment,
          competitionId,
        })
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving grade:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="grade-name">Grade Name</Label>
        <Input
          id="grade-name"
          placeholder="e.g., Preliminary, Elementary, Basic"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade-category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value: string) =>
            setFormData({ ...formData, category: value })
          }
          required
        >
          <SelectTrigger id="grade-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>

        {formData.category === 'custom' && (
          <div className="mt-2">
            <Input
              placeholder="Enter custom category"
              value={formData.category === 'custom' ? '' : formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade-segment">Segment</Label>
        <Select
          value={formData.segment}
          onValueChange={(value: string) =>
            setFormData({ ...formData, segment: value })
          }
          required
        >
          <SelectTrigger id="grade-segment">
            <SelectValue placeholder="Select segment" />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>

        {formData.segment === 'custom' && (
          <div className="mt-2">
            <Input
              placeholder="Enter custom segment"
              value={formData.segment === 'custom' ? '' : formData.segment}
              onChange={(e) =>
                setFormData({ ...formData, segment: e.target.value })
              }
              required
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : grade ? 'Update Grade' : 'Create Grade'}
        </Button>
      </div>
    </form>
  )
}
