# Music Manager Project Development Plan (Comprehensive)

This document outlines a comprehensive project development plan for the "Music Manager" application. The plan is structured in logical phases with clear deliverables, verification steps, and integrated improvements to support secure, maintainable, and high-quality code.

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles – Competitor and Admin – the application supports file management, user administration, and competition scheduling. The technology stack is based on Next.js 15 (latest) with SHADCN components and TypeScript, leveraging Appwrite for backend and storage. Emphasis is placed on mobile responsiveness, robust error handling, functional programming approaches, and secure data practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 1: Environment Setup and Project Scaffolding](#phase-1-environment-setup-and-project-scaffolding)
3. [Phase 2: Appwrite Configuration and Setup](#phase-2-appwrite-configuration-and-setup)
4. [Phase 3: Authentication and User Management](#phase-3-authentication-and-user-management)
5. [Phase 4: Admin Dashboard Development](#phase-4-admin-dashboard-development)
6. [Phase 5: Competitor Dashboard Development](#phase-5-competitor-dashboard-development)
7. [Phase 6: UI/UX Enhancements and Optimization](#phase-6-uiux-enhancements-and-optimization)
8. [Phase 7: Testing and Quality Assurance](#phase-7-testing-and-quality-assurance)
9. [Phase 8: Deployment and Post-Launch Maintenance](#phase-8-deployment-and-post-launch-maintenance)
10. [Security and Additional Considerations](#security-and-additional-considerations)
11. [References](#references)

---

## Project Overview

- **Objective**  
  Build a browser-based platform where Competitors can upload music files for their competitions, and Admins can manage Competitions, Grades, and Users.
- **Core Technologies**

  - Next.js 15+ with TypeScript
  - shadcn/UI components for UI consistency
  - Appwrite for Database, Storage, Authentication, and real-time capabilities
  - React Icons for icons
  - Functional programming approach (React hooks, pure functions, immutable state)

- **Data Model**  
  Below are the primary interfaces referenced throughout the application (mirroring Appwrite document schemas):

  ```typescript
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

  // Extended User Model (using Appwrite Auth)
  export interface User {
    $id: string            // User ID in Appwrite
    email: string          // User email
    firstName: string      // First name (from preferences)
    lastName: string       // Last name (from preferences)
    roles: string[]        // User roles as array (from labels)
    status: 'active' | 'blocked' | 'inactive' // User status
    createdAt: string      // ISO date string when user was created
  }
  ```

---

## Phase 1: Environment Setup and Project Scaffolding

1. **Project Initialization**

   - Create a Next.js 15+ project with TypeScript:
     ```bash
     npx create-next-app@latest music-manager \
       --typescript \
       --tailwind \
       --eslint \
       --app \
       --src-dir \
       --import-alias "@/*"
     ```
   - Enable Turbopack (if desired) for faster local development builds (noting Turbopack is in beta).
   - Maintain a functional programming approach (pure functions, React hooks, etc.).

2. **Component Library Setup**

   - Install shadcn/UI (latest):
     ```bash
     npx shadcn@latest init
     ```
   - Add essential components (example):
     ```bash
     npx shadcn@latest add button
     npx shadcn@latest add form
     npx shadcn@latest add table
     ```
   - Configure theming, animations, and Tailwind CSS 4.0+.

3. **Environment Configuration**

   - Create a `.env.local` file for Appwrite environment variables:
     ```
     # Client-side variables
     NEXT_PUBLIC_APPWRITE_ENDPOINT=
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=
     
     # Server-side variables
     APPWRITE_ENDPOINT=
     APPWRITE_PROJECT_ID=
     APPWRITE_SECRET_KEY=
     APPWRITE_DATABASE_ID=
     APPWRITE_BUCKET_ID=
     APPWRITE_COMPETITIONS_COLLECTION_ID=
     APPWRITE_GRADES_COLLECTION_ID=
     APPWRITE_MUSIC_FILES_COLLECTION_ID=
     ```
   - Add `.env.local` to `.gitignore` to avoid committing sensitive data.

4. **Appwrite SDK Installation**
   ```bash
   # Install both SDKs, but prioritize server SDK
   npm install node-appwrite appwrite
   ```

5. **Version Control & Documentation**
   - Initialize a Git repository:
     ```bash
     git init
     ```
   - Define a branch strategy (e.g., `main`, `dev`, `feature/*`).
   - Document the architecture, file structure, and code style guidelines in a top-level `README.md` or in a `/docs` folder.

---

## Phase 2: Appwrite Configuration and Setup

1. **Appwrite SDK Configuration**

   - Create distinct configuration files for Server SDK and Client SDK:
   
     ```typescript
     // src/lib/appwrite/server.ts for Server SDK
     import { Client, Databases, Storage, Users, Teams } from 'node-appwrite';

     // Initialize the Appwrite client for server-side operations
     const client = new Client()
       .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
       .setProject(process.env.APPWRITE_PROJECT_ID || '')
       .setKey(process.env.APPWRITE_SECRET_KEY || '');

     // Export initialized services
     export const databases = new Databases(client);
     export const storage = new Storage(client);
     export const users = new Users(client);
     export const teams = new Teams(client);
     ```

     ```typescript
     // src/lib/appwrite/client.ts for Web SDK (used only where necessary)
     import { Client, Account, Databases, Storage } from 'appwrite';

     // Initialize the Appwrite client for client-side operations
     const client = new Client()
       .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
       .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

     // Export initialized services
     export const account = new Account(client);
     export const databases = new Databases(client);
     export const storage = new Storage(client);
     ```

2. **Database Collections**

   - Create Collections for `Competitions`, `Grades`, and `MusicFiles`.
   - Configure each collection's permissions. For example, only Admins can create or update Competition records, but both Admins and Competitors can read them.

3. **Roles & Permissions**
   - In Appwrite, define roles as Labels for use with role-based routing in Next.js App Router (e.g., `admin`, `competitor`).
   - Secure endpoints and storage accordingly.

4. **Master Grades Template**
   - Store the NZIFSA Grades list as a structured JSON file at `/src/data/master-grades.json`
   - This template will be used to initialize new competitions with standardized grade options.

5. **Server-Side API Routes Structure**
   - Establish a clear directory structure for API routes:
   ```
   src/app/api/
   ├── auth/
   │   ├── login/route.ts
   │   ├── logout/route.ts
   │   └── register/route.ts
   ├── admin/
   │   ├── competitions/
   │   │   ├── [competitionId]/route.ts
   │   │   └── route.ts
   │   ├── grades/
   │   │   ├── [gradeId]/route.ts
   │   │   └── route.ts
   │   └── users/
   │       ├── [userId]/route.ts
   │       └── route.ts
   └── music/
       ├── [fileId]/route.ts
       └── upload/route.ts
   ```

---

## Phase 3: Authentication and User Management

1. **Server-Side Authentication Handling**

   - Create server-side API routes for user creation, role assignment, and profile management:
   
   ```typescript
   // src/app/api/auth/register/route.ts
   import { NextResponse } from 'next/server';
   import { users } from '@/lib/appwrite/server';
   import { ID } from 'node-appwrite';

   export async function POST(request: Request) {
     try {
       const { email, password, firstName, lastName } = await request.json();
       
       // Create user with Server SDK
       const user = await users.create(
         ID.unique(),
         email,
         password,
         `${firstName} ${lastName}`
       );
       
       // Add custom attributes
       await users.updatePrefs(user.$id, {
         firstName,
         lastName
       });
       
       // Determine if first user (admin) or competitor
       const userCount = (await users.list()).total;
       
       // Assign role based on user count
       if (userCount <= 1) {
         await users.updateLabels(user.$id, ['admin']);
       } else {
         await users.updateLabels(user.$id, ['competitor']);
       }
       
       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Error creating user:', error);
       return NextResponse.json(
         { success: false, message: 'Failed to create user' },
         { status: 500 }
       );
     }
   }
   ```

2. **Client-Side Authentication Integration**

   - Use functional React hooks for authentication state management:
   
   ```typescript
   // src/hooks/useAuth.ts
   import { useState, useEffect } from 'react';
   import { account } from '@/lib/appwrite/client';
   import { useRouter } from 'next/navigation';
   
   export const useAuth = () => {
     const [user, setUser] = useState(null);
     const [isLoading, setIsLoading] = useState(true);
     const router = useRouter();
     
     // Side effect for session check
     useEffect(() => {
       const checkSession = async () => {
         try {
           const session = await account.get();
           setUser(session);
         } catch (error) {
           setUser(null);
         } finally {
           setIsLoading(false);
         }
       };
       
       checkSession();
     }, []);
     
     // Pure functions for auth operations
     const login = async (email: string, password: string) => {
       await account.createEmailSession(email, password);
       const session = await account.get();
       setUser(session);
       return session;
     };
     
     const logout = async () => {
       await account.deleteSession('current');
       setUser(null);
       router.push('/login');
     };
     
     return { user, isLoading, login, logout };
   };
   ```

3. **User Creation and Landing Page:**
   - Develop a main application page with options to create (register) a new user and log in.
   - Use separate forms for Login and Registration.
   - User registration form collects first name, last name, email, and password with proper validation.
   - The Main landing page will have the title 'Music Manager' with a modern music-related icon beside it.

4. **Login and Role-Based Routing:**
   - Implement authentication using Appwrite Authentication.
   - After login, check the user role (Label) from Appwrite and route:
     - Competitor → Competitor Dashboard
     - Admin → Admin Dashboard

5. **Global Navigation:**
   - Include a circular, state-dependent global Login/Logout button accessible on all pages that indicates the current login state.

6. **Error Handling:**
   - Provide clear, user-friendly error messages and loading states throughout the authentication flow, using forms and toasts where appropriate.

---

## Phase 4: Admin Dashboard Development

1. **Server-Side Admin Operations**

   - Implement all admin operations through Server SDK for enhanced security:
   
   ```typescript
   // src/app/api/admin/users/[userId]/route.ts
   import { NextResponse } from 'next/server';
   import { users } from '@/lib/appwrite/server';
   
   export async function PATCH(
     request: Request,
     { params }: { params: { userId: string } }
   ) {
     try {
       const { active, role } = await request.json();
       const { userId } = params;
       
       // Update user status if specified
       if (typeof active !== 'undefined') {
         await users.updateStatus(
           userId,
           active ? 'active' : 'blocked'
         );
       }
       
       // Update user role if specified
       if (role) {
         await users.updateLabels(userId, [role]);
       }
       
       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Error updating user:', error);
       return NextResponse.json(
         { success: false, message: 'Failed to update user' },
         { status: 500 }
       );
     }
   }
   ```

2. **Functional State Management**

   - Use React Query or SWR for data fetching and cache management:
   
   ```typescript
   // src/hooks/useCompetitions.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { fetchCompetitions, createCompetition, updateCompetition, deleteCompetition } from '@/lib/api';
   
   export const useCompetitions = () => {
     const queryClient = useQueryClient();
     
     // Query for fetching competitions
     const competitionsQuery = useQuery({ 
       queryKey: ['competitions'], 
       queryFn: fetchCompetitions 
     });
     
     // Mutation for creating a competition
     const createMutation = useMutation({
       mutationFn: createCompetition,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['competitions'] });
       }
     });
     
     // Mutation for updating a competition
     const updateMutation = useMutation({
       mutationFn: updateCompetition,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['competitions'] });
       }
     });
     
     // Mutation for deleting a competition
     const deleteMutation = useMutation({
       mutationFn: deleteCompetition,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['competitions'] });
       }
     });
     
     return {
       competitions: competitionsQuery.data || [],
       isLoading: competitionsQuery.isLoading,
       error: competitionsQuery.error,
       createCompetition: createMutation.mutate,
       updateCompetition: updateMutation.mutate,
       deleteCompetition: deleteMutation.mutate
     };
   };
   ```

3. **Admin Dashboard Features**

   - Manage user roles, see all competitions, create new competitions, and manage Grades.
   - Provide bulk updates or deletions for user accounts and associated data.
   - Provide a data view of MusicFile submissions.
   - Dashboard should display active and inactive competitions separately.

4. **User Management**

   - Display a list of all users with role information
   - Implement a toggle switch to disable/enable user accounts using Appwrite's `updateStatus` method
   - Allow role changes (promote/demote between competitor and admin)
   - Include an option to delete users completely (with confirmation dialog)

5. **Grade Template Utilities**

   ```typescript
   // src/lib/utils/gradeTemplateUtils.ts

   import { Competition, Grade } from '@/types/models';
   import { databases } from '@/lib/appwrite/server';
   import { ID, Query } from 'node-appwrite';
   import masterGradesData from '@/data/master-grades.json';

   // Database collection IDs (would be defined in environment variables)
   const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
   const COMPETITIONS_COLLECTION_ID = process.env.APPWRITE_COMPETITIONS_COLLECTION_ID || '';
   const GRADES_COLLECTION_ID = process.env.APPWRITE_GRADES_COLLECTION_ID || '';

   /**
    * Creates a competition document in Appwrite
    * Pure function that takes inputs and returns a Promise of the created Competition
    */
   export const createCompetition = async (
     year: number,
     name: string,
     userId: string,
     active: boolean = true
   ): Promise<Competition> => {
     return databases.createDocument(
       DATABASE_ID,
       COMPETITIONS_COLLECTION_ID,
       ID.unique(),
       {
         year,
         name,
         active,
         createdAt: new Date().toISOString(),
         createdBy: userId,
       }
     ) as Promise<Competition>;
   };

   /**
    * Creates a grade document in Appwrite
    * Pure function that takes inputs and returns a Promise of the created Grade
    */
   export const createGrade = async (gradeData: Omit<Grade, '$id'>): Promise<Grade> => {
     return databases.createDocument(
       DATABASE_ID,
       GRADES_COLLECTION_ID,
       ID.unique(),
       gradeData
     ) as Promise<Grade>;
   };

   /**
    * Creates a new competition with all grades from the master template
    * Uses composition of pure functions
    */
   export const createCompetitionFromTemplate = async (
     year: number,
     name: string,
     userId: string,
     active: boolean = true
   ): Promise<Competition> => {
     // Create competition first
     const competition = await createCompetition(year, name, userId, active);
     
     // Then add grades using the competition ID
     await addGradesToCompetition(competition.$id);
     
     return competition;
   };

   /**
    * Maps over the master grades data to generate grade objects
    * Pure function that transforms data without side effects
    */
   export const mapMasterGradesToGradeObjects = (
     competitionId: string
   ): Array<Omit<Grade, '$id'>> => {
     const grades: Array<Omit<Grade, '$id'>> = [];
     
     // Functional approach using map and flatMap
     masterGradesData.categories.forEach(category => {
       const type = category.type;
       
       category.groups.forEach(group => {
         const groupName = group.name;
         
         group.grades.forEach(grade => {
           const categoryName = grade.category;
           
           grade.segments.forEach(segment => {
             grades.push({
               competitionId,
               type,
               groupName,
               category: categoryName,
               segment,
               active: true,
             });
           });
         });
       });
     });
     
     return grades;
   };

   /**
    * Adds all grades from the master template to a competition
    * Uses functional programming with Promise.all for parallel operations
    */
   export const addGradesToCompetition = async (competitionId: string): Promise<void> => {
     try {
       // Generate all grade objects
       const gradeObjects = mapMasterGradesToGradeObjects(competitionId);
       
       // Create all grades in parallel using Promise.all
       await Promise.all(
         gradeObjects.map(gradeData => createGrade(gradeData))
       );
     } catch (error) {
       console.error('Error adding grades to competition:', error);
       throw error;
     }
   };

   /**
    * Clones a competition and its grades
    * Uses functional composition and Promise.all for efficiency
    */
   export const cloneCompetition = async (
     sourceCompetitionId: string,
     year: number,
     name: string,
     userId: string,
     active: boolean = true
   ): Promise<Competition> => {
     // Create new competition
     const newCompetition = await createCompetition(year, name, userId, active);
     
     // Get source grades
     const sourceGrades = await databases.listDocuments(
       DATABASE_ID,
       GRADES_COLLECTION_ID,
       [Query.equal('competitionId', sourceCompetitionId)]
     );
     
     // Map source grades to new competition
     const newGradePromises = sourceGrades.documents.map(sourceGrade => 
       createGrade({
         competitionId: newCompetition.$id,
         type: sourceGrade.type,
         groupName: sourceGrade.groupName,
         category: sourceGrade.category,
         segment: sourceGrade.segment,
         description: sourceGrade.description || '',
         active: sourceGrade.active,
       })
     );
     
     await Promise.all(newGradePromises);
     
     return newCompetition;
   };

   /**
    * Deletes a competition and associated grades
    * Uses functional programming with Promise.all for parallel operations
    */
   export const deleteCompetitionWithCascade = async (competitionId: string): Promise<void> => {
     try {
       // Get all grades for this competition
       const grades = await databases.listDocuments(
         DATABASE_ID,
         GRADES_COLLECTION_ID,
         [Query.equal('competitionId', competitionId)]
       );
       
       // Delete all grades in parallel
       await Promise.all(
         grades.documents.map(grade => 
           databases.deleteDocument(DATABASE_ID, GRADES_COLLECTION_ID, grade.$id)
         )
       );
       
       // Delete the competition
       await databases.deleteDocument(
         DATABASE_ID, 
         COMPETITIONS_COLLECTION_ID, 
         competitionId
       );
     } catch (error) {
       console.error('Error deleting competition with cascade:', error);
       throw error;
     }
   };
   ```

6. **Competition Management Structure**

   - Create a comprehensive Competition management interface with CRUD functionality:
     - **Competition Fields**:
       - Year (numeric)
       - Name (string)
       - Active status (boolean toggle)
       - Created date (automatic timestamp)
       - Created by (automatic - admin user ID)
   
   - **Competition Creation Options**:
     - Create from master template (using NZIFSA Grades list)
     - Clone from existing competition
     - Create empty competition and add grades manually

7. **Grade Management Within Competitions**

   - Enable adding, editing, removing grades for each competition
   - Support batch operations (activate/deactivate multiple grades)
   - Grades should be organized in logical groupings matching the NZIFSA structure
   - Implement a cascading deletion system where deleting a competition removes associated grades and music files

8. **Admin Error Handling**
   - Distinguish between normal usage errors (e.g., invalid form entries) and advanced exceptions (e.g., failure in Appwrite calls).
   - Provide explicit success/failure toasts upon each Admin action.
   - Confirm destructive operations with modal dialogs (e.g., "Are you sure you want to delete this competition?")

---

## Phase 5: Competitor Dashboard Development

1. **Server-Side File Operations**

   - Create secure API routes for file uploads using the Server SDK:
   
   ```typescript
   // src/app/api/music/upload/route.ts
   import { NextResponse } from 'next/server';
   import { databases, storage } from '@/lib/appwrite/server';
   import { ID } from 'node-appwrite';
   import { getServerSession } from 'next-auth/next';
   
   export async function POST(request: Request) {
     try {
       const formData = await request.formData();
       const file = formData.get('file') as File;
       const competitionId = formData.get('competitionId') as string;
       const gradeId = formData.get('gradeId') as string;
       const userId = formData.get('userId') as string;
       
       // Format filename according to convention
       const fileName = await formatFileName(competitionId, gradeId, userId, file.name);
       
       // Upload file using Server SDK
       const uploadedFile = await storage.createFile(
         process.env.APPWRITE_BUCKET_ID || '',
         ID.unique(),
         file
       );
       
       // Create file document with metadata
       const fileDoc = await databases.createDocument(
         process.env.APPWRITE_DATABASE_ID || '',
         process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID || '',
         ID.unique(),
         {
           originalName: file.name,
           fileName,
           storagePath: uploadedFile.$id,
           downloadURL: getFileDownloadUrl(uploadedFile.$id),
           competitionId,
           gradeId,
           userId,
           uploadedAt: new Date().toISOString(),
           size: file.size,
           status: 'active'
         }
       );
       
       return NextResponse.json({ success: true, file: fileDoc });
     } catch (error) {
       console.error('Error uploading music file:', error);
       return NextResponse.json(
         { success: false, message: 'Failed to upload file' },
         { status: 500 }
       );
     }
   }
   
   // Pure function to format filename
   const formatFileName = async (competitionId, gradeId, userId, originalName) => {
     // Implementation to create standardized filename
     // [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME+(LASTNAME INITIAL)]
     // ...
   };
   
   // Pure function to generate download URL
   const getFileDownloadUrl = (fileId) => {
     // Generate download URL
     // ...
   };
   ```

2. **Functional File Upload Hook**

   ```typescript
   // src/hooks/useFileUpload.ts
   import { useState } from 'react';
   
   export const useFileUpload = () => {
     const [isUploading, setIsUploading] = useState(false);
     const [progress, setProgress] = useState(0);
     const [error, setError] = useState<Error | null>(null);
     
     const uploadFile = async (
       file: File, 
       competitionId: string, 
       gradeId: string, 
       userId: string
     ) => {
       setIsUploading(true);
       setProgress(0);
       setError(null);
       
       try {
         const formData = new FormData();
         formData.append('file', file);
         formData.append('competitionId', competitionId);
         formData.append('gradeId', gradeId);
         formData.append('userId', userId);
         
         const response = await fetch('/api/music/upload', {
           method: 'POST',
           body: formData
         });
         
         if (!response.ok) {
           throw new Error('Upload failed');
         }
         
         return await response.json();
       } catch (err) {
         setError(err instanceof Error ? err : new Error('Unknown error'));
         throw err;
       } finally {
         setIsUploading(false);
       }
     };
     
     return { uploadFile, isUploading, progress, error };
   };
   ```

3. **Competitor Dashboard Features**

   - Display a personal file list for each logged-in Competitor.
   - Support uploading, downloading, previewing, and deleting music files.
   - Allow editing of user profiles (names, email, etc.).

4. **File Upload with Cascading Selection Interface**

   - Implement a multi-step selection process:
     1. Select Competition (only active competitions shown)
     2. Select Category (dynamically filtered based on selected competition)
     3. Select Segment (dynamically filtered based on selected category)
   
   - Enforce standardized file naming convention:
     ```
     [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME+(LASTNAME INITIAL)]
     ```
     Example: `2025-GlenburnIFSC-BasicNoviceGirls-ShortProgram-SarahJ.mp3`
   
   - Store all reference IDs (competitionId, gradeId, userId) in the MusicFile document

5. **Storage Integration**

   - Use Appwrite Storage for the upload, track progress with a functional approach to side effects (React hook or custom hook).
   - Save metadata in the MusicFile collection: originalName, fileName, size, duration (optional), timestamps, etc.
   - Add validation for music file types (mp3, wav, etc.) and maximum size limits

6. **UI/UX**
   - Use colorful, modern shadcn/UI components for forms, lists, and alerts.
   - Provide accessible feedback for file operations (loading spinners, success/failure messages).
   - Implement mobile-responsive interfaces for all upload forms

---

## Phase 6: UI/UX Enhancements and Optimization

1. **Responsive & Modern Design**

   - Design for mobile-first using Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.).
   - Implement color gradients, theming variables, and transitions with Tailwind or Framer Motion.

2. **Functional Programming Paradigm**

   - Keep UI logic modular and composable (e.g., custom hooks for repeated logic).
   - Favor pure functions for data processing, and minimal side effects.

3. **Performance Considerations**

   - Leverage Next.js 15+ server components for data fetching directly on the server.
   - Use dynamic imports for large or rarely needed components.

4. **Server-Side Rendering with Next.js**
   - Use Next.js's Server Components for data fetching directly on the server
   - Use the Server SDK in server components for secure operations

5. **Advanced UI Patterns**
   - Optionally use data visualization or interactive charts for Admin statistics (uploaded files per competition, user activity, etc.).
   - Provide a consistent design language: button shapes, margins, typography.

---

## Phase 7: Testing and Quality Assurance

1. **Unit and Integration Tests**

   - Use Jest or Vitest with React Testing Library for core functionality:
     - Test pure functions with Jest or Vitest
     - Test hooks with React Testing Library
   - Achieve ~80–90% coverage on critical paths.

2. **End-to-End Tests**

   - Employ Cypress or Playwright for higher-level tests covering typical user journeys:
     - Admin creating a competition
     - Competitor uploading music

3. **Security Audits**

   - Use OWASP ZAP or similar tools to scan for vulnerabilities.
   - Regularly `npm audit` for any known package CVEs.

4. **Performance and Accessibility**

   - Lighthouse CI or PageSpeed for performance metrics (target 90+).
   - Axe or Jest-axe for accessibility checks (WCAG 2.1 AA compliance).

5. **Continuous Integration**

   - Example GitHub Actions workflow:

     ```yaml
     name: CI Pipeline
     on: [push]

     jobs:
       build-and-test:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: actions/setup-node@v3
             with:
               node-version: 20.x
           - run: npm ci
           - run: npm run build
           - run: npm run test
     ```

---

## Phase 8: Deployment and Post-Launch Maintenance

1. **Deployment Preparation**

   - Ensure environment variables (Appwrite endpoints, IDs) are set for production hosting (Vercel, AWS, etc.).
   - Confirm cross-origin setups if Appwrite is in a separate domain.

2. **CDN and Caching**

   - Use Appwrite hosting or an external CDN to deliver static assets globally.
   - Cache large or frequently requested files to improve performance.

3. **Monitoring and Logging**

   - Configure logs for errors (Sentry, LogRocket, or Appwrite's logging).
   - Set up alerts for unusual storage usage or repeated upload failures.

4. **Iterative Feature Development**
   - Gather real-world feedback from Admins and Competitors.
   - Implement incremental improvements or new features (e.g., real-time notifications, advanced file analytics).

---

## Security and Additional Considerations

1. **Appwrite Permissions and Policies**

   - Rely on Appwrite roles to restrict Admin functionality (competition creation, user management).
   - Competitor files remain private to each user except for Admin oversight.

2. **Encryption and Data Protection**

   - Appwrite secures files at rest automatically.
   - Use HTTPS on all requests to protect data in transit.

3. **Functional Best Practices**

   - Avoid shared mutable state in modules, prefer well-defined contexts and reducers if needed.
   - Regularly refactor to reduce side-effect heavy code.

4. **Scalability**
   - Employ horizontal scaling if hosting Appwrite on dedicated infrastructure.
   - Optimize file upload size limits and concurrency for large user volumes.

---

## References

- [Next.js 15+ Documentation](https://nextjs.org/docs)
- [shadcn/UI Documentation](https://ui.shadcn.com/docs/installation/next)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Auth Documentation](https://appwrite.io/docs/products/auth)
- [OWASP ZAP](https://owasp.org/www-project-zap/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress.io](https://www.cypress.io/)

---

**This extended plan reflects a robust, maintainable, and scalable approach to building the Music Manager application with Next.js 15+, functional JavaScript techniques, modern UI patterns, and Appwrite's secure backend services.**
