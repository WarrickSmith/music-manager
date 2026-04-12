# Music Manager Implementation Plan: Phase 5 - Competitor Dashboard Development

This implementation plan details the development of the Competitor Dashboard for the Music Manager application. It builds on Phases 1-4, leveraging existing architecture and code. The plan follows a modular approach with clearly defined, separately implementable sections.

## Table of Contents

1. [Overview & Context](#overview--context)
2. [Dashboard Structure Setup](#1-dashboard-structure-setup)
3. [Server-Side Actions Implementation](#2-server-side-actions-implementation)
4. [My Files Tab Development](#3-my-files-tab-development)
5. [Upload Music Tab Development](#4-upload-music-tab-development)
6. [Profile Management Tab Development](#5-profile-management-tab-development)
7. [Progress Tracking & Status Management](#6-progress-tracking--status-management)
8. [UI/UX & Error Handling](#7-uiux--error-handling)
9. [Testing & Validation](#8-testing--validation)

## Overview & Context

The Competitor Dashboard is a dedicated interface for competitors to manage their music files for various competitions. This implementation follows the architecture established in previous phases:

- **Server-Side Operations**: All operations use Appwrite's Node.js SDK and Server Actions
- **Role-Based Access**: Leverages existing auth system that directs competitors to their dashboard
- **Data Model**: Uses existing schema for Competitions, Grades, and MusicFiles collections
- **UI Components**: Maintains consistency with Admin Dashboard using shadcn/UI components

Key requirements:

- Tabbed interface similar to Admin Dashboard
- Cascading dropdowns for file selection (Year → Competition → Category → Segment)
- Progress tracking for file uploads
- Display of only active competitions for uploads, but all uploaded files regardless of competition status
- Consistent tab color theming matching the background color of tab headers

## 1. Dashboard Structure Setup

**Context**: The Competitor Dashboard needs to follow similar patterns to the Admin Dashboard with a tabbed interface. The basic structure is currently a placeholder in `src/components/dashboard/competitor-view.tsx`.

### 1.1 Tabbed Layout Component

Create the tabbed layout structure for the Competitor Dashboard.

```typescript
// src/components/dashboard/competitor/competitor-dashboard.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MyFiles from './my-files'
import UploadMusic from './upload-music'
import ProfileManagement from './profile-management'

export default function CompetitorDashboard({ userId }: { userId: string }) {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6">Competitor Dashboard</h1>

      <Tabs defaultValue="my-files" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-files">My Files</TabsTrigger>
          <TabsTrigger value="upload">Upload Music</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent
          value="my-files"
          className="p-4 border rounded-md mt-2 bg-sky-50"
        >
          <MyFiles userId={userId} />
        </TabsContent>

        <TabsContent
          value="upload"
          className="p-4 border rounded-md mt-2 bg-emerald-50"
        >
          <UploadMusic userId={userId} />
        </TabsContent>

        <TabsContent
          value="profile"
          className="p-4 border rounded-md mt-2 bg-violet-50"
        >
          <ProfileManagement userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 1.2 Update Competitor View Component

Update the existing competitor view to use the new dashboard.

```typescript
// src/components/dashboard/competitor-view.tsx
import { getCurrentUser } from '@/lib/auth/auth-service'
import CompetitorDashboard from './competitor/competitor-dashboard'

export default async function CompetitorView() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>You must be logged in to view this page.</div>
  }

  return (
    <div className="p-8">
      <CompetitorDashboard userId={user.$id} />
    </div>
  )
}
```

### 1.3 Create Tab Component Placeholders

Create placeholder components for each tab to be developed in later sections:

```typescript
// src/components/dashboard/competitor/my-files.tsx
export default function MyFiles({ userId }: { userId: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Music Files</h2>
      <p>This section will display your uploaded music files.</p>
    </div>
  )
}

// src/components/dashboard/competitor/upload-music.tsx
export default function UploadMusic({ userId }: { userId: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Music</h2>
      <p>This section will allow you to upload new music files.</p>
    </div>
  )
}

// src/components/dashboard/competitor/profile-management.tsx
export default function ProfileManagement({ userId }: { userId: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
      <p>This section will allow you to manage your profile information.</p>
    </div>
  )
}
```

## 2. Server-Side Actions Implementation

**Context**: All operations for the Competitor Dashboard must use the Appwrite server-side Node.js SDK rather than client-side API calls. This follows the pattern established in previous phases.

### 2.1 Music File Actions

Create a server action file for all music file operations.

```typescript
// src/app/actions/music-file-actions.ts
'use server'

import { databases, storage, ID, Query } from '@/lib/appwrite/server'
import {
  formatFileName,
  getFileDownloadUrl,
  isValidMusicFileType,
} from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'

const databaseId = process.env.APPWRITE_DATABASE_ID!
const bucketId = process.env.APPWRITE_BUCKET_ID!
const musicFilesCollectionId = process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

/**
 * Get all music files for a specific user
 */
export async function getUserMusicFiles(userId: string) {
  try {
    const response = await databases.listDocuments(
      databaseId,
      musicFilesCollectionId,
      [Query.equal('userId', userId), Query.orderDesc('uploadedAt')]
    )
    return response.documents
  } catch (error) {
    console.error('Error fetching user music files:', error)
    throw new Error('Failed to fetch your music files')
  }
}

/**
 * Upload a new music file
 */
export async function uploadMusicFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const competitionId = formData.get('competitionId') as string
    const gradeId = formData.get('gradeId') as string
    const userId = formData.get('userId') as string

    if (!file || !competitionId || !gradeId || !userId) {
      throw new Error('Missing required information')
    }

    // Validate file type
    if (!isValidMusicFileType(file.type)) {
      throw new Error('Invalid file type. Only audio files are accepted.')
    }

    // Generate standardized file name
    const formattedFileName = await formatFileName(
      competitionId,
      gradeId,
      userId,
      file.name
    )

    // Get competition and grade details for denormalization
    const competition = await databases.getDocument(
      databaseId,
      process.env.APPWRITE_COMPETITIONS_COLLECTION_ID!,
      competitionId
    )

    const grade = await databases.getDocument(
      databaseId,
      process.env.APPWRITE_GRADES_COLLECTION_ID!,
      gradeId
    )

    // Create a file ID
    const fileId = ID.unique()

    // Upload file to storage
    const uploadedFile = await storage.createFile(bucketId, fileId, file)

    // Create document in MusicFiles collection
    const musicFileDocument = await databases.createDocument(
      databaseId,
      musicFilesCollectionId,
      ID.unique(),
      {
        originalName: file.name,
        fileName: formattedFileName,
        storagePath: `${bucketId}/${fileId}`,
        downloadURL: getFileDownloadUrl(fileId),
        competitionId,
        competitionName: competition.name,
        competitionYear: competition.year,
        gradeId,
        gradeType: grade.name,
        gradeCategory: grade.category,
        gradeSegment: grade.segment,
        userId,
        userName: formData.get('userName') as string,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: 'ready',
      }
    )

    revalidatePath('/dashboard')
    return { success: true, musicFile: musicFileDocument }
  } catch (error) {
    console.error('Error uploading music file:', error)
    throw new Error(
      `Failed to upload music file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Delete a music file
 */
export async function deleteMusicFile(fileId: string, musicFileId: string) {
  try {
    // Delete file from storage
    await storage.deleteFile(bucketId, fileId)

    // Delete document from MusicFiles collection
    await databases.deleteDocument(
      databaseId,
      musicFilesCollectionId,
      musicFileId
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting music file:', error)
    throw new Error('Failed to delete music file')
  }
}

/**
 * Get file download URL
 */
export async function getMusicFileDownloadUrl(fileId: string) {
  try {
    return { url: getFileDownloadUrl(fileId) }
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw new Error('Failed to generate download URL')
  }
}
```

### 2.2 Competition and Grade Action Extensions

Add competitor-specific methods to the existing competition actions.

```typescript
// Add to src/app/actions/competition-actions.ts

/**
 * Get all active competitions
 */
export async function getActiveCompetitions() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      competitionsCollectionId,
      [
        Query.equal('active', true),
        Query.orderDesc('year'),
        Query.orderAsc('name'),
      ]
    )
    return response.documents
  } catch (error) {
    console.error('Error fetching active competitions:', error)
    throw new Error('Failed to fetch active competitions')
  }
}

/**
 * Get grades for a competition with optional filtering
 */
export async function getGradesForCompetition(
  competitionId: string,
  category?: string
) {
  try {
    const queries = [Query.equal('competitionId', competitionId)]

    if (category) {
      queries.push(Query.equal('category', category))
    }

    const response = await databases.listDocuments(
      databaseId,
      gradesCollectionId,
      queries
    )

    return response.documents
  } catch (error) {
    console.error('Error fetching grades:', error)
    throw new Error('Failed to fetch grades')
  }
}

/**
 * Get unique grade categories for a competition
 */
export async function getGradeCategoriesForCompetition(competitionId: string) {
  try {
    const grades = await databases.listDocuments(
      databaseId,
      gradesCollectionId,
      [Query.equal('competitionId', competitionId)]
    )

    // Extract unique categories
    const categories = new Set<string>()
    for (const grade of grades.documents) {
      categories.add(grade.category)
    }

    return Array.from(categories).sort()
  } catch (error) {
    console.error('Error fetching grade categories:', error)
    throw new Error('Failed to fetch grade categories')
  }
}
```

### 2.3 User Profile Operations

Add methods to view and update competitor profile information.

```typescript
// Add to src/app/actions/user-actions.ts
'use server'

import { users } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'

/**
 * Get user profile information
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await users.get(userId)
    const prefs = await users.getPrefs(userId)

    return {
      id: user.$id,
      email: user.email,
      name: user.name,
      prefs,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to fetch user profile')
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    prefs?: Record<string, any>
  }
) {
  try {
    const updates: Promise<any>[] = []

    if (data.name) {
      updates.push(users.updateName(userId, data.name))
    }

    if (data.prefs) {
      updates.push(users.updatePrefs(userId, data.prefs))
    }

    await Promise.all(updates)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }
}
```

## 3. My Files Tab Development

**Context**: The My Files tab displays all the music files uploaded by the competitor, regardless of whether the competition is active or not. This tab should allow viewing, downloading, and deleting files.

### 3.1 File Card Component

Create a reusable component for displaying individual music files.

```typescript
// src/components/dashboard/competitor/file-card.tsx
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatFileSize, formatDate } from '@/lib/utils'
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
  deleteMusicFile,
  getMusicFileDownloadUrl,
} from '@/app/actions/music-file-actions'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

type MusicFileProps = {
  id: string
  fileId: string
  fileName: string
  originalName: string
  competitionName: string
  competitionYear: number
  gradeType: string
  gradeCategory: string
  gradeSegment: string
  uploadedAt: string
  size: number
  status: string
}

export default function FileCard({ file }: { file: MusicFileProps }) {
  const [isLoading, setIsLoading] = useState(false)

  // Extract fileId from storagePath
  const storagePath = file.storagePath || ''
  const fileId = storagePath.split('/').pop() || ''

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      const { url } = await getMusicFileDownloadUrl(fileId)

      // Create a temporary anchor element to trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('Download started')
    } catch (error) {
      toast.error('Failed to download file')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await deleteMusicFile(fileId, file.id)
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="relative">
      {isLoading && <LoadingOverlay text="Processing..." />}

      <CardHeader>
        <CardTitle className="text-lg">{file.fileName}</CardTitle>
        <CardDescription>Original: {file.originalName}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-semibold">Competition:</p>
            <p>
              {file.competitionYear} {file.competitionName}
            </p>
          </div>
          <div>
            <p className="font-semibold">Grade:</p>
            <p>
              {file.gradeType} ({file.gradeCategory} - {file.gradeSegment})
            </p>
          </div>
          <div>
            <p className="font-semibold">Uploaded:</p>
            <p>{formatDate(file.uploadedAt)}</p>
          </div>
          <div>
            <p className="font-semibold">Size:</p>
            <p>{formatFileSize(file.size)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownload}>
          Download
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                music file from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
```

### 3.2 My Files Tab Content

Create the "My Files" tab content to display all user's music files.

```typescript
// src/components/dashboard/competitor/my-files.tsx
'use client'

import { useState, useEffect } from 'react'
import { getUserMusicFiles } from '@/app/actions/music-file-actions'
import FileCard from './file-card'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function MyFiles({ userId }: { userId: string }) {
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true)
        const userFiles = await getUserMusicFiles(userId)
        setFiles(userFiles)
      } catch (error) {
        toast.error('Failed to load your music files')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [userId])

  // Group files by competition
  const filesByCompetition = files.reduce((acc, file) => {
    const key = `${file.competitionYear}-${file.competitionName}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(file)
    return acc
  }, {} as Record<string, any[]>)

  // Sort competitions by year (descending)
  const sortedCompetitions = Object.keys(filesByCompetition).sort((a, b) => {
    const yearA = parseInt(a.split('-')[0])
    const yearB = parseInt(b.split('-')[0])
    return yearB - yearA
  })

  if (isLoading) {
    return <LoadingOverlay text="Loading your music files..." />
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">My Music Files</h2>
        <p className="text-gray-500 mb-4">
          You haven't uploaded any music files yet.
        </p>
        <p className="text-gray-500">
          Use the <span className="font-medium">Upload Music</span> tab to add
          your first music file.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Music Files</h2>
      <p className="mb-6">
        Total Files: <Badge variant="outline">{files.length}</Badge>
      </p>

      {sortedCompetitions.map((competition) => (
        <div key={competition} className="mb-8">
          <h3 className="text-xl font-medium mb-4">{competition}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filesByCompetition[competition].map((file) => (
              <FileCard
                key={file.$id}
                file={{
                  id: file.$id,
                  fileId: file.fileId,
                  fileName: file.fileName,
                  originalName: file.originalName,
                  competitionName: file.competitionName,
                  competitionYear: file.competitionYear,
                  gradeType: file.gradeType,
                  gradeCategory: file.gradeCategory,
                  gradeSegment: file.gradeSegment,
                  uploadedAt: file.uploadedAt,
                  size: file.size,
                  status: file.status,
                  storagePath: file.storagePath,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 3.3 Utility Functions

Add utility functions for formatting dates and file sizes.

```typescript
// Add to src/lib/utils.ts

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
```

## 4. Upload Music Tab Development

**Context**: The Upload Music tab should allow competitors to upload new music files using a cascading selection process. Competitors should only see active competitions.

### 4.1 File Upload Form with Cascading Dropdowns

Create the file upload form with cascading dropdowns for competition selection.

```typescript
// src/components/dashboard/competitor/upload-music.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { Progress } from '@/components/ui/progress'
import {
  getActiveCompetitions,
  getGradeCategoriesForCompetition,
  getGradesForCompetition,
} from '@/app/actions/competition-actions'
import { uploadMusicFile } from '@/app/actions/music-file-actions'
import { getUserProfile } from '@/app/actions/user-actions'

// Form validation schema
const formSchema = z.object({
  competitionId: z.string({ required_error: 'Please select a competition' }),
  category: z.string({ required_error: 'Please select a category' }),
  gradeId: z.string({ required_error: 'Please select a grade' }),
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine(
      (file) => file.size <= 15 * 1024 * 1024,
      'File size must be less than 15MB'
    )
    .refine((file) => {
      const validTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/x-wav',
        'audio/x-m4a',
        'audio/mp4',
        'audio/aac',
        'audio/x-aac',
      ]
      return validTypes.includes(file.type)
    }, 'File must be an audio file (MP3, WAV, M4A, AAC)'),
})

type FormValues = z.infer<typeof formSchema>

export default function UploadMusic({ userId }: { userId: string }) {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      competitionId: '',
      category: '',
      gradeId: '',
      file: undefined,
    },
  })

  const { watch, setValue, reset } = form
  const competitionId = watch('competitionId')
  const category = watch('category')

  // Fetch competitions and user info on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [competitionsData, userProfile] = await Promise.all([
          getActiveCompetitions(),
          getUserProfile(userId),
        ])

        setCompetitions(competitionsData)
        setUserName(userProfile.name)
      } catch (error) {
        toast.error('Failed to load data')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Fetch categories when competition changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!competitionId) {
        setCategories([])
        return
      }

      try {
        setIsLoading(true)
        const categoriesData = await getGradeCategoriesForCompetition(
          competitionId
        )
        setCategories(categoriesData)
        setValue('category', '')
        setValue('gradeId', '')
      } catch (error) {
        toast.error('Failed to load categories')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [competitionId, setValue])

  // Fetch grades when category changes
  useEffect(() => {
    const fetchGrades = async () => {
      if (!competitionId || !category) {
        setGrades([])
        return
      }

      try {
        setIsLoading(true)
        const gradesData = await getGradesForCompetition(
          competitionId,
          category
        )
        setGrades(gradesData)
        setValue('gradeId', '')
      } catch (error) {
        toast.error('Failed to load grades')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrades()
  }, [competitionId, category, setValue])

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsUploading(true)

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Create form data
      const formData = new FormData()
      formData.append('file', values.file)
      formData.append('competitionId', values.competitionId)
      formData.append('gradeId', values.gradeId)
      formData.append('userId', userId)
      formData.append('userName', userName)

      // Upload the file
      await uploadMusicFile(formData)

      clearInterval(interval)
      setUploadProgress(100)

      toast.success('File uploaded successfully')

      // Reset form
      reset()
      setUploadProgress(0)
    } catch (error) {
      toast.error(
        `Upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Music</h2>

      <Card className="p-6 relative">
        {isLoading && <LoadingOverlay text="Loading..." />}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Competition Selection */}
            <FormField
              control={form.control}
              name="competitionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competition</FormLabel>
                  <Select
                    disabled={
                      isLoading || isUploading || competitions.length === 0
                    }
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a competition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {competitions.map((competition) => (
                        <SelectItem
                          key={competition.$id}
                          value={competition.$id}
                        >
                          {competition.year} - {competition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only active competitions are shown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={
                      isLoading ||
                      isUploading ||
                      !competitionId ||
                      categories.length === 0
                    }
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grade Selection */}
            <FormField
              control={form.control}
              name="gradeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select
                    disabled={
                      isLoading ||
                      isUploading ||
                      !category ||
                      grades.length === 0
                    }
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.$id} value={grade.$id}>
                          {grade.name} - {grade.segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Music File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="audio/*"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onChange(file)
                        }
                      }}
                      {...rest}
                    />
                  </FormControl>
                  <FormDescription>
                    Max file size: 15MB. Supported formats: MP3, WAV, M4A, AAC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Music File'}
            </Button>
          </form>
        </Form>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">File Naming Convention</h3>
        <p className="text-sm text-gray-500">
          Your file will be automatically renamed using the following format:
          <code className="block p-2 my-2 bg-gray-100 rounded text-xs">
            [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME+(LASTNAME
            INITIAL)]
          </code>
          This helps organizers easily identify and manage music files for
          competitions.
        </p>
      </div>
    </div>
  )
}
```

## 5. Profile Management Tab Development

**Context**: The Profile Management tab allows competitors to view and edit their profile details, similar to the Admin Profile Management.

### 5.1 Profile Management Component

Create the profile management component for competitors.

```typescript
// src/components/dashboard/competitor/profile-management.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { getUserProfile, updateUserProfile } from '@/app/actions/user-actions'

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  preferredContact: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional(),
  organization: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function ProfileManagement({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      preferredContact: '',
      phoneNumber: '',
      organization: '',
    },
  })

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const profile = await getUserProfile(userId)

        form.reset({
          name: profile.name || '',
          preferredContact: profile.prefs?.preferredContact || '',
          phoneNumber: profile.prefs?.phoneNumber || '',
          organization: profile.prefs?.organization || '',
        })
      } catch (error) {
        toast.error('Failed to load profile')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, form])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true)

      await updateUserProfile(userId, {
        name: values.name,
        prefs: {
          preferredContact: values.preferredContact,
          phoneNumber: values.phoneNumber,
          organization: values.organization,
        },
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>

      <Card className="relative">
        {(isLoading || isSaving) && (
          <LoadingOverlay text={isLoading ? 'Loading...' : 'Saving...'} />
        )}

        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading || isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading || isSaving}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading || isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization/Club</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading || isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading || isSaving}>
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            If you need to change your password or email address, please contact
            an administrator.
          </p>

          <p className="text-sm">
            Your account role: <span className="font-medium">Competitor</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 6. Progress Tracking & Status Management

**Context**: The progress tracking feature should be implemented using the server-side Appwrite Node.js SDK as specified, not the realtime client SDK.

### 6.1 Progress Tracking Hook

Create a hook to manage upload progress tracking.

```typescript
// src/hooks/useUploadProgress.ts
import { useState, useEffect } from 'react'

// This is a simulated progress tracker since we can't use the client-side SDK
// It provides a reasonable approximation of upload progress for the UI
export const useUploadProgress = () => {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle')
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Reset progress and status
  const reset = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setProgress(0)
    setStatus('idle')
  }

  // Start upload progress simulation
  const startProgress = () => {
    reset()
    setStatus('uploading')

    // Simulate progress with realistic slowdown as progress increases
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(id)
          return prev
        }

        // Slower progress as we get closer to 100%
        const increment = prev < 50 ? 5 : prev < 80 ? 3 : 1
        return Math.min(prev + increment, 95)
      })
    }, 200)

    setIntervalId(id)
  }

  // Complete the progress
  const completeProgress = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setProgress(100)
    setStatus('complete')
  }

  // Set error state
  const setError = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setStatus('error')
  }

  // Set processing state (after upload, before complete)
  const setProcessing = () => {
    setStatus('processing')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [intervalId])

  return {
    progress,
    status,
    startProgress,
    completeProgress,
    setProcessing,
    setError,
    reset,
  }
}
```

### 6.2 Enhanced Progress UI Component

Create a reusable progress indicator component.

```typescript
// src/components/ui/progress-indicator.tsx
import { Progress } from '@/components/ui/progress'
import { cva } from 'class-variance-authority'

interface ProgressIndicatorProps {
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  showPercentage?: boolean
  className?: string
}

const statusTextVariants = cva('text-sm text-center mt-1', {
  variants: {
    status: {
      idle: 'text-gray-500',
      uploading: 'text-blue-500',
      processing: 'text-amber-500',
      complete: 'text-green-500',
      error: 'text-red-500',
    },
  },
})

const progressVariants = cva('h-2 w-full', {
  variants: {
    status: {
      idle: '',
      uploading: '',
      processing: '',
      complete: 'bg-green-500',
      error: 'bg-red-500',
    },
  },
})

export function ProgressIndicator({
  progress,
  status,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready'
      case 'uploading':
        return `Uploading${showPercentage ? ` (${Math.round(progress)}%)` : ''}`
      case 'processing':
        return 'Processing file...'
      case 'complete':
        return 'Complete!'
      case 'error':
        return 'Error encountered'
    }
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <Progress value={progress} className={progressVariants({ status })} />
      <p className={statusTextVariants({ status })}>{getStatusText()}</p>
    </div>
  )
}
```

### 6.3 Update Upload Component

Modify the Upload component to use the progress tracking hook.

```typescript
// Update to src/components/dashboard/competitor/upload-music.tsx

// Add these imports
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { ProgressIndicator } from '@/components/ui/progress-indicator'

// Replace the uploadProgress state and isUploading state with:
const {
  progress,
  status,
  startProgress,
  completeProgress,
  setProcessing,
  setError,
  reset,
} = useUploadProgress()

// Replace the existing progress UI with:
{
  status !== 'idle' && (
    <div className="my-4">
      <ProgressIndicator
        progress={progress}
        status={status}
        showPercentage={true}
      />
    </div>
  )
}

// Update the onSubmit function to use the progress hook
const onSubmit = async (values: FormValues) => {
  try {
    startProgress()

    // Create form data
    const formData = new FormData()
    formData.append('file', values.file)
    formData.append('competitionId', values.competitionId)
    formData.append('gradeId', values.gradeId)
    formData.append('userId', userId)
    formData.append('userName', userName)

    // After 90% progress, show processing status
    setTimeout(() => {
      if (status === 'uploading') {
        setProcessing()
      }
    }, 2000)

    // Upload the file
    await uploadMusicFile(formData)

    completeProgress()
    toast.success('File uploaded successfully')

    // Reset form after a short delay to show completed state
    setTimeout(() => {
      reset()
      form.reset()
    }, 2000)
  } catch (error) {
    setError()
    toast.error(
      `Upload failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
    console.error(error)
  }
}
```

## 7. UI/UX & Error Handling

**Context**: The UI/UX should be consistent with the application's existing patterns and include proper error handling with toast notifications.

### 7.1 Common UI Components

Create shared UI elements to ensure consistency across the dashboard.

```typescript
// src/components/dashboard/competitor/section-header.tsx
import { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="mt-4 sm:mt-0">{action}</div>}
    </div>
  )
}
```

### 7.2 Empty State Components

Create reusable empty state components for different scenarios.

```typescript
// src/components/dashboard/competitor/empty-state.tsx
import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {icon && <div className="text-gray-400 mb-4 text-4xl">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
```

### 7.3 Error Boundary Component

Create an error boundary component to handle unexpected errors.

```typescript
// src/components/dashboard/competitor/error-boundary.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 border rounded-md bg-red-50 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 7.4 Document Title & Tab Management

Create a component to manage document title and tab state.

```typescript
// src/hooks/useDocumentTitle.ts
import { useEffect } from 'react'

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Music Manager`

    return () => {
      document.title = previousTitle
    }
  }, [title])
}
```

## 8. Testing & Validation

**Context**: Though this section doesn't include actual unit tests, it provides guidance on what should be tested to ensure the Competitor Dashboard functions correctly.

### 8.1 Manual Testing Checklist

Create a testing checklist to verify all functionality.

```markdown
# Competitor Dashboard Testing Checklist

## Dashboard Structure

- [ ] Dashboard loads without errors
- [ ] Tabs are displayed correctly
- [ ] Tab navigation works as expected
- [ ] Mobile responsive layout works correctly

## My Files Tab

- [ ] Files display correctly for the logged-in user
- [ ] Files are grouped by competition
- [ ] Download functionality works
- [ ] Delete functionality works with confirmation dialog
- [ ] Empty state displays when no files exist

## Upload Music Tab

- [ ] Only active competitions are shown in dropdown
- [ ] Cascading dropdowns work correctly (Competition → Category → Grade)
- [ ] File validation works (size, type)
- [ ] Progress indicator updates during upload
- [ ] Success/error messages display correctly
- [ ] Form resets after successful upload

## Profile Management Tab

- [ ] User profile loads correctly
- [ ] Form validation works
- [ ] Profile updates are saved correctly
- [ ] Success/error messages display correctly

## Error Handling

- [ ] Network errors are handled gracefully
- [ ] Form validation errors display clearly
- [ ] Toast notifications appear for appropriate actions
- [ ] Error boundaries catch unexpected errors

## Security

- [ ] Only logged-in competitors can access the dashboard
- [ ] Competitors can only see their own files
- [ ] File type validation enforced server-side
```

### 8.2 Validation Utilities

Create utility functions for validation in both client and server contexts.

```typescript
// src/lib/validation.ts

/**
 * Validates if a file is a valid audio file
 */
export function isValidAudioFile(file: File): boolean {
  const validTypes = [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/x-wav', // WAV alternate MIME
    'audio/x-m4a', // M4A
    'audio/mp4', // M4A alternate MIME
    'audio/aac', // AAC
    'audio/x-aac', // AAC alternate MIME
  ]

  return validTypes.includes(file.type)
}

/**
 * Validates if a file size is within the allowed limit
 */
export function isValidFileSize(file: File, maxSizeMB: number = 15): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Generate meaningful error messages for validation failures
 */
export function getFileValidationErrorMessage(file: File): string | null {
  if (!isValidAudioFile(file)) {
    return 'Invalid file type. Please upload an audio file (MP3, WAV, M4A, or AAC).'
  }

  if (!isValidFileSize(file)) {
    return 'File is too large. Maximum size is 15MB.'
  }

  return null
}
```

---

This implementation plan provides a comprehensive, modular approach to developing the Competitor Dashboard for the Music Manager application. Each section builds on previous ones and is designed to be independently implementable, allowing for staged development. The plan follows the technology choices and architecture established in previous phases, ensuring consistency throughout the application.
