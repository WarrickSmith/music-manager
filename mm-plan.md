# Music Manager Project Development Plan (Extended)

This document is an extended version of the Music Manager development plan, enhanced with additional details from the "Comprehensive Project Development Plan Overhaul for Modern Web Stack Implementation." It integrates Appwrite for backend services, adheres to functional programming paradigms in JavaScript, uses npm as the package manager, and employs a modern UI design with shadcn/UI for Next.js 15+. Phases 4 and 5 are reversed so that the Admin Dashboard is established before the Competitor Dashboard, and the UI is refined for a modern, colorful experience.

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
  - Functional programming approach (React hooks, pure functions, immutable state)

- **Data Model**  
  Below are the primary interfaces referenced throughout the application (mirroring Appwrite document schemas):

  ```typescript
  interface Competition {
    $id: string
    name: string
    startDate: string
    endDate: string
    active: boolean
  }

  interface Grade {
    $id: string
    name: string
    description?: string
  }

  interface User {
    $id: string
    email: string
    fullName: string
    firstName: string
    lastName: string
    role: 'admin' | 'competitor'
    createdAt: string
  }

  interface MusicFile {
    $id: string
    originalName: string
    fileName: string
    storagePath: string
    downloadURL: string
    competitionId: string
    gradeId: string
    userId: string
    uploadedAt: string
    duration?: number
    size: number
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
   - Enable Turbopack
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
     NEXT_PUBLIC_APPWRITE_ENDPOINT=
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=
     NEXT_PUBLIC_APPWRITE_DATABASE_ID=
     NEXT_PUBLIC_APPWRITE_BUCKET_ID=
     ...
     ```
   - Add `.env.local` to `.gitignore` to avoid committing sensitive data.

4. **Version Control & Documentation**
   - Initialize a Git repository:
     ```bash
     git init
     ```
   - Define a branch strategy (e.g., `main`, `dev`, `feature/*`).
   - Document the architecture, file structure, and code style guidelines in a top-level `README.md` or in a `/docs` folder.

---

## Phase 2: Appwrite Configuration and Setup

1. **Appwrite SDK Installation**
   ```bash
   npm install appwrite
   ```
2. **Appwrite Project Setup**

   - Create or configure a new Appwrite project from the Appwrite console or CLI.
   - Copy the Project ID and Endpoint to `.env.local`:
     ```
     NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
     NEXT_PUBLIC_APPWRITE_PROJECT_ID="your-project-id"
     ```

3. **Appwrite Client Initialization**

   ```typescript name=src/lib/appwrite-config.ts
   import { Client, Account, Databases, Storage, ID } from 'appwrite'

   const client = new Client()
     .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)

   export const account = new Account(client)
   export const databases = new Databases(client)
   export const storage = new Storage(client)
   export { ID } // For document ID generation
   ```

4. **Database Collections**

   - Create Collections for `Users`, `Competitions`, `Grades`, and `MusicFiles`.
   - Configure each collection’s permissions. For example, only Admins can create or update Competition records, but both Admins and Competitors can read them.

5. **Roles & Permissions**
   - In Appwrite, define roles (e.g., `admin`, `competitor`) to reflect the roles stored in your application’s `User` collection.
   - Secure endpoints and storage accordingly.

---

## Phase 3: Authentication and User Management

1. **Functional Auth Approach**

   - Use React hooks and a global AuthContext for user session management, encouraging functional patterns:

     ```typescript name=src/providers/AuthProvider.tsx
     import React, { createContext, useEffect, useState } from 'react'
     import { account } from '@/lib/appwrite-config'

     interface AuthState {
       status: 'loading' | 'authenticated' | 'unauthenticated'
       user: any
     }

     export const AuthContext = createContext<AuthState | null>(null)

     export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
       children,
     }) => {
       const [authState, setAuthState] = useState<AuthState>({
         status: 'loading',
         user: null,
       })

       useEffect(() => {
         const checkSession = async () => {
           try {
             const currentUser = await account.get()
             setAuthState({ status: 'authenticated', user: currentUser })
           } catch {
             setAuthState({ status: 'unauthenticated', user: null })
           }
         }
         checkSession()
       }, [])

       return (
         <AuthContext.Provider value={authState}>
           {children}
         </AuthContext.Provider>
       )
     }
     ```

2. **User Creation and Roles**

   - On initial user sign-up, if no users exist yet, mark the new user as `admin`; otherwise, assign `competitor`.
   - Store user details (firstName, lastName, email, role) in a custom Appwrite `Users` collection for trackable roles.

3. **Login and Profile**

   - Leverage Appwrite’s `account.createEmailSession` or OAuth sessions.
   - Provide a circular Login/Logout button in a global header. If authenticated, it logs out the user; if not, it routes to a login page.

4. **Error Handling**
   - Use shadcn/UI toasts for invalid credentials or session errors.
   - Validate user input (Zod/React Hook Form) and give detailed form error messages.

---

## Phase 4: Admin Dashboard Development

(Reordered ahead of Competitor Dashboard.)

1. **Admin Dashboard Features**

   - Manage user roles, see all competitions, create new competitions, and manage Grades.
   - Provide bulk updates or deletions for user accounts and associated data.
   - Provide a data view of MusicFile submissions.

2. **Competition and Grade Management**

   - Create a view listing all Competitions:
     - Start/end dates, active status, relevant Grades.
   - Manage Grades inside each Competition (creation, editing, removal).
   - Confirm destructive tasks (e.g., removing an entire Competition).

3. **Bulk Operations**

   - Handle arrays of document IDs for user role changes or batch deletions.

4. **Admin Error Handling**
   - Distinguish between normal usage errors (e.g., invalid form entries) and advanced exceptions (e.g., failure in Appwrite calls).
   - Provide explicit success/failure toasts upon each Admin action.

---

## Phase 5: Competitor Dashboard Development

1. **Competitor Dashboard Features**

   - Display a personal file list for each logged-in Competitor.
   - Support uploading, downloading, previewing, and deleting music files.
   - Allow editing of user profiles (names, email, etc.).

2. **File Upload with Competition/Grade Requirements**

   - Show a form with dropdowns for Competition and Grade, ensuring the user picks valid references before uploading.
   - Enforce file naming:
     ```
     [YYYY]-[COMPETITION]-[GRADE]-[FIRSTNAME+(LASTNAME INITIAL)]
     ```
   - Store references (competitionId, gradeId, userId) in the MusicFile document.

3. **Storage Integration**

   - Use Appwrite Storage for the upload, track progress with a functional approach to side effects (React hook or custom hook).
   - Save metadata in the MusicFile collection: originalName, fileName, size, duration (optional), timestamps, etc.

4. **UI/UX**
   - Use colorful, modern shadcn/UI components for forms, lists, and alerts.
   - Provide accessible feedback for file operations (loading spinners, success/failure messages).

---

## Phase 6: UI/UX Enhancements and Optimization

1. **Responsive & Modern Design**

   - Design for mobile-first using Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.).
   - Implement color gradients, theming variables, and transitions with Tailwind or Framer Motion.

2. **Functional Programming Paradigm**

   - Keep UI logic modular and composable (e.g., custom hooks for repeated logic).
   - Favor pure functions for data processing, and minimal side effects.

3. **Performance Considerations**

   - Next.js 15+ can leverage server components where beneficial.
   - Use dynamic imports for large or rarely needed components.

4. **Advanced UI Patterns**
   - Optionally use data visualization or interactive charts for Admin statistics (uploaded files per competition, user activity, etc.).
   - Provide a consistent design language: button shapes, margins, typography.

---

## Phase 7: Testing and Quality Assurance

1. **Unit and Integration Tests**

   - Use Jest or Vitest with React Testing Library for core functionality (auth, file upload, dashboards).
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

     ```yaml name=.github/workflows/ci.yml
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

   - Configure logs for errors (Sentry, LogRocket, or Appwrite’s logging).
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
- [OWASP ZAP](https://owasp.org/www-project-zap/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress.io](https://www.cypress.io/)

---

**This extended plan reflects a robust, maintainable, and scalable approach to building the Music Manager application with Next.js 15+, functional JavaScript techniques, modern UI patterns, and Appwrite’s secure backend services.**
