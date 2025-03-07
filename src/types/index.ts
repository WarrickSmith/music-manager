export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'competitor'
}

export interface Competition {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  description?: string
  status: 'active' | 'inactive' | 'completed'
}

export interface Grade {
  id: string
  competitionId: string
  name: string
  category: string
  description?: string
}

export interface MusicFile {
  id: string
  originalName: string
  fileName: string
  storagePath: string
  fileId: string
  competitionId: string
  gradeId: string
  userId: string
  uploadedAt: string
  size: number
  status: 'active' | 'inactive' | 'deleted'
}
