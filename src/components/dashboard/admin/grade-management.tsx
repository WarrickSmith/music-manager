'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Pencil, Plus, Trash, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getGradesByCompetition,
  createGrade,
  updateGrade,
  deleteGrade,
} from '@/app/actions/grade-actions'

interface Competition {
  $id: string
  name: string
  year: number
  active: boolean
}

interface Grade {
  $id: string
  name: string
  category: string
  segment: string
  competitionId: string
}

interface GradeManagementProps {
  competition: Competition
  onCompetitionUpdate: () => void
}

interface EditableGrade {
  $id?: string
  name: string
  category: string
  segment: string
  isNew?: boolean
}

export default function GradeManagement({
  competition,
  onCompetitionUpdate,
}: GradeManagementProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditableGrade | null>(null)
  const [selectedNameFilter, setSelectedNameFilter] = useState<string>('all')

  const loadGrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getGradesByCompetition(competition.$id)
      setGrades(data as unknown as Grade[])
      setSelectedNameFilter('all') // Reset filter when loading new grades
      setEditingGradeId(null) // Clear any editing state
      setEditForm(null)
    } catch (error) {
      toast.error(`Failed to load grades: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }, [competition.$id])

  useEffect(() => {
    if (competition) {
      loadGrades()
    }
  }, [competition, loadGrades])

  const handleStartEditing = (grade: Grade | null) => {
    if (grade) {
      setEditingGradeId(grade.$id)
      setEditForm({
        $id: grade.$id,
        name: grade.name,
        category: grade.category,
        segment: grade.segment,
      })
    } else {
      // Creating a new grade (empty row at the top)
      setEditingGradeId('new')
      setEditForm({
        name: '',
        category: '',
        segment: '',
        isNew: true,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingGradeId(null)
    setEditForm(null)
  }

  const handleSaveGrade = async () => {
    if (!editForm) return

    try {
      if (editForm.isNew) {
        // Create new grade
        await createGrade({
          name: editForm.name,
          category: editForm.category,
          segment: editForm.segment,
          competitionId: competition.$id,
        })
        toast.success('Grade added successfully')
      } else if (editForm.$id) {
        // Update existing grade
        await updateGrade(editForm.$id, {
          name: editForm.name,
          category: editForm.category,
          segment: editForm.segment,
        })
        toast.success('Grade updated successfully')
      }

      loadGrades()
      onCompetitionUpdate() // Notify parent component about the change
    } catch (error) {
      toast.error(`Failed to save grade: ${(error as Error).message}`)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await deleteGrade(gradeId)
      toast.success('Grade deleted successfully')
      loadGrades()
      onCompetitionUpdate() // Notify parent component about the change
    } catch (error) {
      toast.error(`Failed to delete grade: ${(error as Error).message}`)
    }
  }

  // Get unique grade names for the filter dropdown
  const uniqueGradeNames = useMemo(() => {
    const names = new Set(grades.map((grade) => grade.name))
    return Array.from(names).sort()
  }, [grades])

  // Filter grades based on selected name
  const filteredGrades = useMemo(() => {
    if (selectedNameFilter === 'all') {
      // Filter all grades and apply sorting
      // Sort by name Z-A first, then by category A-Z, then by segment A-Z
      return [...grades].sort((a, b) => {
        // First sort by name Z-A (descending)
        const nameComparison = b.name.localeCompare(a.name);
        if (nameComparison !== 0) return nameComparison;
        
        // If names are the same, sort by category A-Z (ascending)
        const categoryComparison = a.category.localeCompare(b.category);
        if (categoryComparison !== 0) return categoryComparison;
        
        // If categories are the same, sort by segment A-Z (ascending)
        return a.segment.localeCompare(b.segment);
      });
    } 
    
    // When filtering by a specific name, still sort by category and segment
    return grades
      .filter((grade) => grade.name === selectedNameFilter)
      .sort((a, b) => {
        // Sort by category A-Z first
        const categoryComparison = a.category.localeCompare(b.category);
        if (categoryComparison !== 0) return categoryComparison;
        
        // Then by segment A-Z
        return a.segment.localeCompare(b.segment);
      });
  }, [grades, selectedNameFilter]);

  return (
    <>
      <Card className="border-indigo-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-semibold text-indigo-700">
              {competition.name} - Grades
            </CardTitle>
            <p className="text-sm text-indigo-500 mt-1">
              {competition.active
                ? 'Active Competition'
                : 'Inactive Competition'}{' '}
              ({competition.year})
            </p>
          </div>
          <Button
            onClick={() => handleStartEditing(null)}
            className="bg-indigo-500 hover:bg-indigo-600"
            disabled={editingGradeId !== null}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Grade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label
              htmlFor="name-filter"
              className="text-xs text-indigo-800 font-semibold mb-1 block"
            >
              Filter by Name
            </Label>
            <Select
              value={selectedNameFilter}
              onValueChange={setSelectedNameFilter}
              disabled={editingGradeId !== null}
            >
              <SelectTrigger
                id="name-filter"
                className="bg-white border-indigo-100 text-indigo-800 font-medium"
              >
                <SelectValue placeholder="Select grade name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-indigo-800 font-medium">
                  All Grade Names
                </SelectItem>
                {uniqueGradeNames.map((name) => (
                  <SelectItem
                    key={name}
                    value={name}
                    className="text-indigo-800"
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-indigo-500">
              Loading grades...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-indigo-200">
                  <TableHead className="text-indigo-700">
                    <div className="flex items-center">
                      Name
                      <span className="ml-2 text-xs text-indigo-500">(Z-A)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-indigo-700">
                    <div className="flex items-center">
                      Category
                      <span className="ml-2 text-xs text-indigo-500">(A-Z)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-indigo-700">
                    <div className="flex items-center">
                      Segment
                      <span className="ml-2 text-xs text-indigo-500">(A-Z)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-indigo-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* New grade row */}
                {editingGradeId === 'new' && editForm && (
                  <TableRow className="bg-indigo-50 border-indigo-300">
                    <TableCell>
                      <Input
                        placeholder="Grade name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Category"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Segment"
                        value={editForm.segment}
                        onChange={(e) =>
                          setEditForm({ ...editForm, segment: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveGrade}
                          className="text-green-500 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {filteredGrades.length === 0 && editingGradeId !== 'new' ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-indigo-400"
                    >
                      {selectedNameFilter === 'all'
                        ? 'No grades found for this competition'
                        : 'No grades match your filter'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGrades.map((grade) =>
                    editingGradeId === grade.$id && editForm ? (
                      // Editing existing grade row
                      <TableRow
                        key={grade.$id}
                        className="bg-indigo-50 border-indigo-300"
                      >
                        <TableCell>
                          <Input
                            placeholder="Grade name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="border-indigo-300 focus:border-indigo-500"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Category"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value,
                              })
                            }
                            className="border-indigo-300 focus:border-indigo-500"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Segment"
                            value={editForm.segment}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                segment: e.target.value,
                              })
                            }
                            className="border-indigo-300 focus:border-indigo-500"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleSaveGrade}
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Normal display row
                      <TableRow key={grade.$id} className="border-indigo-100">
                        <TableCell className="font-medium text-indigo-700">
                          {grade.name}
                        </TableCell>
                        <TableCell className="text-indigo-600">
                          {grade.category}
                        </TableCell>
                        <TableCell className="text-indigo-600">
                          {grade.segment}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditing(grade)}
                              className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                              disabled={editingGradeId !== null}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  disabled={editingGradeId !== null}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Grade
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the &ldquo;
                                    {grade.name}&rdquo; grade? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white font-medium hover:bg-red-600"
                                    onClick={() => handleDeleteGrade(grade.$id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
