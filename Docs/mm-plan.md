# Music Manager Project Development Plan

This document outlines a comprehensive project development plan for the "Music Manager" application, updated to reflect the use of Appwrite's server-side Node.js SDK for all operations, simplified authentication, and the `sonner` package for toast notifications. The plan is structured in logical phases with clear deliverables, verification steps, and integrated improvements to support secure, maintainable, and high-quality code.

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles – Competitor and Admin – the application supports file management, user administration, and competition scheduling. The technology stack is based on Next.js 15 (latest) with SHADCN components and TypeScript, leveraging Appwrite for backend and storage via the server-side Node.js SDK. Emphasis is placed on mobile responsiveness, robust error handling, functional programming approaches, and secure data practices.

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
  Build a browser-based platform where Competitors can upload music files for their competitions, and Admins can manage Competitions, Grades, and Users, all using server-side operations with Appwrite’s Node.js SDK.
- **Core Technologies**

  - Next.js 15+ with TypeScript
  - shadcn/UI components for UI consistency
  - Appwrite server-side Node.js SDK for Database, Storage, and Authentication
  - Server Actions using the Appwrite node.js SDK for Appwrite integration not API endpoints.
  - `sonner` package for toast notifications
  - React Icons for icons
  - Functional programming approach (React hooks, pure functions, immutable state)

- **Data Model**
  - The data model is defined in music-manager-data-model.md in the Docs directory

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

   - Create a `.env.local` file for Appwrite environment variables, using `APPWRITE_SECRET_KEY` for the API key:

     ```
     # Server-side variables
     APPWRITE_ENDPOINT=
     APPWRITE_PROJECT_ID=
     APPWRITE_API_KEY=
     APPWRITE_DATABASE_ID=
     APPWRITE_BUCKET_ID=
     APPWRITE_COMPETITIONS_COLLECTION_ID=
     APPWRITE_GRADES_COLLECTION_ID=
     APPWRITE_MUSIC_FILES_COLLECTION_ID=

     # Client-side variables
     NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=67b4344c000f4ea08aad

     ```

   - Add `.env.local` to `.gitignore` to avoid committing sensitive data.

4. **Appwrite SDK Installation**

   - Install only the server-side Node.js SDK:
     ```bash
     npm install node-appwrite
     ```
   - Install the `sonner` package for toast notifications:
     ```bash
     npm install sonner
     ```

5. **Version Control & Documentation**
   - Initialize a Git repository:
     ```bash
     git init
     ```
   - Define a branch strategy (e.g., `main`, `dev`, `feature/*`).
   - Document the architecture, file structure, and code style guidelines in a top-level `README.md` or in a `/docs` folder, including references to `/Docs/Appwrite Docs` for server-side examples.

---

## Phase 2: Appwrite Configuration and Setup

1. **Appwrite SDK Configuration**

   - Configure the server-side Appwrite Node.js SDK exclusively, using the API key

2. **Database Collections**

   - Create Collections for `Competitions`, `Grades`, and `MusicFiles` using the server-side SDK.
   - The Docs directory has a setup-appwrite.ts script that can be used in the project and run from package.json using npm run from the terminal.

3. **Roles & Permissions**

   - In Appwrite, define roles as Labels for use with existing role-based routing in Next.js App Router (e.g., `admin`, `competitor`).
   - Secure endpoints and storage accordingly via server-side operations.

4. **Master Grades Template**
   - There are default grades defined in the Docs directory in the default-grades.ts file.

---

## Phase 3: Authentication and User Management

1. **Server-Side Authentication Handling**

   - Implement authentication entirely server-side using the Appwrite Node.js SDK with the API key.
   - Implement Role-based routing for Competitors and Admins in the Next.js application each with their own landing page (Dashboard) once logged in. Role based routing should use the users 'Label' for Role.
   - the Docs directory has a Next.js Server side authentication code example appwrite-ss-auth.md.

2. **User Creation and Landing Page:**

   - Update the main application page connecting the options to create (register) a new user and log in, using server-side API calls.
   - Use separate forms for Login and Registration.
   - User registration form collects first name, last name, email, and password with proper validation. The first name and last name are to be stored as Appwrite User Preferences.
   - Upon registering, the users role should be created as an Appwrite 'Label'. The very first user ever created in the database will have the 'admin' role, every subsequent user created will have the 'competitor' role by default. These will be able to be managed through the Admin dashboard in a later plan phase.
   - The landing page should not trigger an authentication check until a user logs in.

3. **Login and Role-Based Routing:**

   - Authentication is handled server-side with the Appwrite Node.js SDK. Post-login redirection leverages role-based routing:
     - Competitor → Competitor Dashboard
     - Admin → Admin Dashboard
     - For asynchronous events like login, logout and register, the application will show a spinner with some text describing the event. The spinner should be center in the screen and behind the spinner should be blurred out.
     - A sonner toast should be displayed in the bottom right side of the screen for each event, such as logged in, logged out and errors. Multiple toast's should push older toasts up the screen.

4. **Global Navigation:**

   - Update the Global Nave login/logout icon button to either logout if logged in (redirecting on logout to the main application landing page) and if logged out, redirect to the login form (may be managed by state). The login/logout icon should change colour when logged in with Purple for Admin and Green for a competitor and blue when logged out.

5. **Error Handling:**
   - Provide clear, user-friendly error messages and loading states using the `sonner` package for toast notifications:
     ```typescript
     import { toast } from 'sonner'
     toast.error('Failed to create user')
     toast.success('User created successfully')
     ```

---

## Phase 4: Admin Dashboard Development

1. **Server-Side Admin Operations**

   - Implement all admin operations using the server-side Appwrite Node.js SDK:

     ```typescript
     // src/app/api/admin/users/[userId]/route.ts
     import { NextResponse } from 'next/server'
     import { users } from '@/lib/appwrite/server'

     export async function PATCH(
       request: Request,
       { params }: { params: { userId: string } }
     ) {
       try {
         const { active, role } = await request.json()
         const { userId } = params

         if (typeof active !== 'undefined') {
           await users.updateStatus(userId, active ? 'active' : 'blocked')
         }

         if (role) {
           await users.updateLabels(userId, [role])
         }

         return NextResponse.json({ success: true })
       } catch (error) {
         console.error('Error updating user:', error)
         return NextResponse.json(
           { success: false, message: 'Failed to update user' },
           { status: 500 }
         )
       }
     }
     ```

2. **Functional State Management**

   - Use React Query or SWR for data fetching and cache management, interacting with server-side API routes.

3. **Admin Dashboard Features**

   - Manage user roles, see all competitions, create new competitions, and manage Grades via server-side operations.
   - Provide bulk updates or deletions for user accounts and associated data.
   - Provide a data view of MusicFile submissions.
   - Dashboard should display active and inactive competitions separately.

4. **User Management**

   - Display a list of all users with role information.
   - Implement a toggle switch to disable/enable user accounts using the server-side `users.updateStatus` method.
   - Allow role changes (promote/demote between competitor and admin).
   - Include an option to delete users completely (with confirmation dialog).

5. **Grade Template Utilities**

   - Use server-side utilities for competition and grade management (as in the original plan), leveraging the Node.js SDK.

6. **Competition Management Structure**

   - Create a comprehensive Competition management interface with CRUD functionality via server-side API routes.

7. **Grade Management Within Competitions**

   - Enable adding, editing, removing grades for each competition using server-side operations.
   - Support batch operations and cascading deletions.

8. **Admin Error Handling**
   - Use `sonner` for success/failure toasts:
     ```typescript
     import { toast } from 'sonner'
     toast.success('Competition created successfully')
     toast.error('Failed to delete user')
     ```
   - Confirm destructive operations with modal dialogs.

---

## Phase 5: Competitor Dashboard Development

1. **Server-Side File Operations**

   - Implement all music file management (upload, download, delete) server-side using the Node.js SDK Storage service. Real-time upload progress tracking is no longer required:

     ```typescript
     // src/app/api/music/upload/route.ts
     import { NextResponse } from 'next/server'
     import { databases, storage } from '@/lib/appwrite/server'
     import { ID } from 'node-appwrite'

     export async function POST(request: Request) {
       try {
         const formData = await request.formData()
         const file = formData.get('file') as File
         const competitionId = formData.get('competitionId') as string
         const gradeId = formData.get('gradeId') as string
         const userId = formData.get('userId') as string

         const fileName = await formatFileName(
           competitionId,
           gradeId,
           userId,
           file.name
         )

         const uploadedFile = await storage.createFile(
           process.env.APPWRITE_BUCKET_ID || '',
           ID.unique(),
           file
         )

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
             status: 'active',
           }
         )

         return NextResponse.json({ success: true, file: fileDoc })
       } catch (error) {
         console.error('Error uploading music file:', error)
         return NextResponse.json(
           { success: false, message: 'Failed to upload file' },
           { status: 500 }
         )
       }
     }
     ```

   - Refer to https://appwrite.io/docs/references/cloud/server-nodejs/storage for Storage API details.

2. **Functional File Upload Hook**

   - Update the hook to interact with server-side API routes without progress tracking:

     ```typescript
     // src/hooks/useFileUpload.ts
     import { useState } from 'react'

     export const useFileUpload = () => {
       const [isUploading, setIsUploading] = useState(false)
       const [error, setError] = useState<Error | null>(null)

       const uploadFile = async (
         file: File,
         competitionId: string,
         gradeId: string,
         userId: string
       ) => {
         setIsUploading(true)
         setError(null)

         try {
           const formData = new FormData()
           formData.append('file', file)
           formData.append('competitionId', competitionId)
           formData.append('gradeId', gradeId)
           formData.append('userId', userId)

           const response = await fetch('/api/music/upload', {
             method: 'POST',
             body: formData,
           })

           if (!response.ok) throw new Error('Upload failed')
           return await response.json()
         } catch (err) {
           setError(err instanceof Error ? err : new Error('Unknown error'))
           throw err
         } finally {
           setIsUploading(false)
         }
       }

       return { uploadFile, isUploading, error }
     }
     ```

3. **Competitor Dashboard Features**

   - Display a personal file list for each logged-in Competitor, fetched via server-side API routes.
   - Support uploading, downloading, previewing, and deleting music files through server-side endpoints.

4. **File Upload with Cascading Selection Interface**

   - Implement a multi-step selection process (Competition, Category, Segment) with server-side validation.
   - Enforce standardized file naming convention:
     ```
     [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME+(LASTNAME INITIAL)]
     ```

5. **Storage Integration**

   - Use Appwrite Storage server-side for all file operations, saving metadata in the MusicFile collection.
   - Add validation for file types and size limits server-side.

6. **UI/UX**
   - Use `sonner` for feedback on file operations:
     ```typescript
     import { toast } from 'sonner'
     toast.success('File uploaded successfully')
     toast.error('Upload failed')
     ```

---

## Phase 6: UI/UX Enhancements and Optimization

1. **Responsive & Modern Design**

   - Design for mobile-first using Tailwind breakpoints.

2. **Functional Programming Paradigm**

   - Keep UI logic modular and composable.

3. **Performance Considerations**

   - Leverage Next.js 15+ server components for server-side data fetching.

4. **Server-Side Rendering with Next.js**

   - Use Server Components with the Node.js SDK for secure operations.

5. **Advanced UI Patterns**
   - Use `sonner` for consistent toast notifications across the app.

---

## Phase 7: Testing and Quality Assurance

1. **Unit and Integration Tests**

   - Test server-side API routes and hooks.

2. **End-to-End Tests**

   - Test user journeys (e.g., Competitor uploading music) with server-side operations.

3. **Security Audits**

   - Ensure API key security and proper permissions.

4. **Performance and Accessibility**

   - Optimize server-side operations for performance.

5. **Continuous Integration**

   - Maintain CI pipeline as in the original plan.

---

## Phase 8: Deployment and Post-Launch Maintenance

1. **Deployment Preparation**

   - Set `APPWRITE_SECRET_KEY` and other variables for production.

2. **CDN and Caching**

   - Cache static assets for performance.

3. **Monitoring and Logging**

   - Log server-side errors and monitor usage.

4. **Iterative Feature Development**
   - Gather feedback for improvements.

---

## Security and Additional Considerations

1. **Appwrite Permissions and Policies**

   - Use server-side SDK with API key for secure operations.

2. **Encryption and Data Protection**

   - Rely on Appwrite’s security features.

3. **Functional Best Practices**

   - Avoid mutable state, favoring server-side logic.

4. **Scalability**
   - Optimize server-side operations for scale.

---

## References

- [Next.js 15+ Documentation](https://nextjs.org/docs)
- [shadcn/UI Documentation](https://ui.shadcn.com/docs/installation/next)
- [Appwrite Server-Side API Reference](https://appwrite.io/docs/references/cloud/server-nodejs)
- [Appwrite Storage API](https://appwrite.io/docs/references/cloud/server-nodejs/storage)
- [Sonner Documentation](https://sonner.dev/)
- [Server-Side Auth Examples](/Docs/Appwrite Docs/appwrite-ss-auth)
- [Additional Server-Side Examples](/Docs/Appwrite Docs)
