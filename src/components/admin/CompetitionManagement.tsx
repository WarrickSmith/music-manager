'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Models } from 'appwrite'

interface Competition extends Models.Document {
  name: string
  startDate: string
  endDate: string
  active: boolean
}

interface Grade extends Models.Document {
  name: string
  description?: string
  competitionId: string
}

export function CompetitionManagement() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null)

  // Fetch competitions when component mounts
  useEffect(() => {
    fetchCompetitions()
  }, [])

  // Fetch grades when selected competition changes
  useEffect(() => {
    if (selectedCompetition) {
      fetchGrades(selectedCompetition.$id)
    }
  }, [selectedCompetition])

  // API functions
  const fetchCompetitionsList = async () => {
    const response = await fetch('/api/competitions')
    if (!response.ok) {
      throw new Error('Failed to fetch competitions')
    }
    const data = await response.json()
    return data.competitions
  }

  const fetchGradesList = async (competitionId: string) => {
    const response = await fetch(`/api/grades?competitionId=${competitionId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch grades')
    }
    const data = await response.json()
    return data.grades
  }

  const createNewCompetition = async (
    data: Omit<Competition, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    const response = await fetch('/api/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create competition')
    }
    return response.json()
  }

  const updateExistingCompetition = async (
    competitionId: string,
    data: Partial<Competition>
  ) => {
    const response = await fetch('/api/competitions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId, ...data }),
    })
    if (!response.ok) {
      throw new Error('Failed to update competition')
    }
    return response.json()
  }

  const deleteExistingCompetition = async (competitionId: string) => {
    const response = await fetch('/api/competitions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId }),
    })
    if (!response.ok) {
      throw new Error('Failed to delete competition')
    }
  }

  const createNewGrade = async (
    data: Omit<Grade, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    const response = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create grade')
    }
    return response.json()
  }

  const updateExistingGrade = async (gradeId: string, data: Partial<Grade>) => {
    const response = await fetch('/api/grades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeId, ...data }),
    })
    if (!response.ok) {
      throw new Error('Failed to update grade')
    }
    return response.json()
  }

  const deleteExistingGrade = async (gradeId: string) => {
    const response = await fetch('/api/grades', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeId }),
    })
    if (!response.ok) {
      throw new Error('Failed to delete grade')
    }
  }

  // Hook functions
  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const competitions = await fetchCompetitionsList()
      setCompetitions(competitions)
    } catch (err) {
      setError('Failed to fetch competitions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async (competitionId: string) => {
    try {
      const grades = await fetchGradesList(competitionId)
      setGrades(grades)
    } catch (err) {
      setError('Failed to fetch grades')
      console.error(err)
    }
  }

  // Data mutation functions
  const createCompetition = async (
    data: Omit<Competition, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    try {
      await createNewCompetition(data)
      await fetchCompetitions()
    } catch (err) {
      setError('Failed to create competition')
      console.error(err)
    }
  }

  const updateCompetition = async (
    competitionId: string,
    data: Partial<Competition>
  ) => {
    try {
      await updateExistingCompetition(competitionId, data)
      await fetchCompetitions()
    } catch (err) {
      setError('Failed to update competition')
      console.error(err)
    }
  }

  const deleteCompetition = async (competitionId: string) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        await deleteExistingCompetition(competitionId)
        await fetchCompetitions()
        if (selectedCompetition?.$id === competitionId) {
          setSelectedCompetition(null)
          setGrades([])
        }
      } catch (err) {
        setError('Failed to delete competition')
        console.error(err)
      }
    }
  }

  const createGrade = async (
    data: Omit<Grade, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    try {
      await createNewGrade(data)
      if (selectedCompetition) {
        await fetchGrades(selectedCompetition.$id)
      }
    } catch (err) {
      setError('Failed to create grade')
      console.error(err)
    }
  }

  const updateGrade = async (gradeId: string, data: Partial<Grade>) => {
    try {
      await updateExistingGrade(gradeId, data)
      if (selectedCompetition) {
        await fetchGrades(selectedCompetition.$id)
      }
    } catch (err) {
      setError('Failed to update grade')
      console.error(err)
    }
  }

  const deleteGrade = async (gradeId: string) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await deleteExistingGrade(gradeId)
        if (selectedCompetition) {
          await fetchGrades(selectedCompetition.$id)
        }
      } catch (err) {
        setError('Failed to delete grade')
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competition Management</h2>
        <Button
          onClick={() => {
            // TODO: Open create competition modal
            const mockCompetition = {
              name: 'New Competition',
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              active: true,
            }
            createCompetition(mockCompetition)
          }}
        >
          Create Competition
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Competitions List */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading competitions...
                  </TableCell>
                </TableRow>
              ) : competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No competitions found
                  </TableCell>
                </TableRow>
              ) : (
                competitions.map((competition) => (
                  <TableRow
                    key={competition.$id}
                    className={
                      selectedCompetition?.$id === competition.$id
                        ? 'bg-muted'
                        : ''
                    }
                  >
                    <TableCell>{competition.name}</TableCell>
                    <TableCell>
                      {new Date(competition.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(competition.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          competition.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {competition.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompetition(competition)}
                      >
                        Manage Grades
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCompetition(competition.$id, {
                            active: !competition.active,
                          })
                        }
                      >
                        Toggle Active
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCompetition(competition.$id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Grades List */}
        <div className="border rounded-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {selectedCompetition
                ? `Grades for ${selectedCompetition.name}`
                : 'Select a competition to manage grades'}
            </h3>
            {selectedCompetition && (
              <Button
                onClick={() => {
                  // TODO: Open create grade modal
                  const mockGrade = {
                    name: 'New Grade',
                    description: 'Grade description',
                    competitionId: selectedCompetition.$id,
                  }
                  createGrade(mockGrade)
                }}
              >
                Add Grade
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedCompetition ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Select a competition to view grades
                  </TableCell>
                </TableRow>
              ) : grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No grades found
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => (
                  <TableRow key={grade.$id}>
                    <TableCell>{grade.name}</TableCell>
                    <TableCell>{grade.description}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Open edit grade modal
                          const mockUpdate = {
                            name: `${grade.name} (updated)`,
                          }
                          updateGrade(grade.$id, mockUpdate)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteGrade(grade.$id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
