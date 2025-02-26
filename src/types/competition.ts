import { Models } from 'appwrite'

export interface Competition extends Models.Document {
  name: string
  year: number
  active: boolean
}

export interface Grade extends Models.Document {
  name: string
  category: string
  segment: string
  competitionId: string
}
