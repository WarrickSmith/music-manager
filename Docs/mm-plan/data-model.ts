// src/types/models.ts

// Competition Model
export interface Competition {
  $id: string            // Document ID in Appwrite
  year: number           // Competition year (e.g., 2025)
  name: string           // Competition name (e.g., "Glenburn IFSC Club Comp")
  active: boolean        // Whether competition is active and visible to competitors
  createdAt: string      // ISO date string when competition was created
  createdBy: string      // User ID of admin who created the competition
}

// Grade Model (enhanced with category and segment)
export interface Grade {
  $id: string            // Document ID in Appwrite
  competitionId: string  // Reference to parent competition
  type: string           // "Singles", "Pairs", "Ice Dance", etc.
  groupName: string      // "Basic Novice", "Junior", etc.
  category: string       // "Basic Novice Girls", "Senior Men", etc.
  segment: string        // "Short Program", "Free Skate", etc.
  description?: string   // Optional additional information
  active: boolean        // Whether this grade is active and visible to competitors
}

// Music File Model (enhanced with competition and grade references)
export interface MusicFile {
  $id: string            // Document ID in Appwrite
  originalName: string   // Original filename from user's system
  fileName: string       // Standardized filename for storage
  storagePath: string    // Path in Appwrite Storage
  downloadURL: string    // Generated download URL
  competitionId: string  // Reference to competition
  gradeId: string        // Reference to specific grade
  userId: string         // Reference to competitor who uploaded
  uploadedAt: string     // ISO date string when file was uploaded
  duration?: number      // Optional music duration in seconds
  size: number           // File size in bytes
  status: 'active' | 'archived' // Status of the file
}

// Extended User Model
export interface User {
  $id: string            // User ID in Appwrite
  email: string          // User email
  firstName: string      // First name (from preferences)
  lastName: string       // Last name (from preferences)
  roles: string[]        // User roles as array (from labels)
  status: 'active' | 'blocked' | 'inactive' // User status
  createdAt: string      // ISO date string when user was created
}