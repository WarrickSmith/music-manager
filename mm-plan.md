# Music Manager Project Development Plan

This document outlines a comprehensive, Markdown-formatted project development plan for the "Music Manager" application. The plan is structured in logical phases with clear deliverables, verification steps, and integrated improvements to support secure, maintainable, and high-quality code.

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles – Competitor and Admin – the application supports file management, user administration, and competition scheduling. The technology stack is based on Next.js 15 (latest) with SHADCN components and TypeScript, leveraging Firebase for backend and storage. Emphasis is placed on mobile responsiveness, robust error handling, and secure data practices.

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

- Appwrite Server and Client API details are in the ./Docs directory.

1. **Appwrite SDK Installation**
   ```bash
   npm install appwrite
   ```
2. **Appwrite Project Setup**

   - Appwrite will be used in hybrid mode withe both the Client (Web) and Server (Node.js) SDK's installed. Use Client or Server API code where relevant in the project.

   - Copy the Project ID and Endpoint to `.env.local`:
     ```
     NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
     NEXT_PUBLIC_APPWRITE_PROJECT_ID="your-project-id"
     APPWRITE_SECRET_KEY="your-project-secret-key"
     ```

3. **Database Collections**

   - Create Collections for `Competitions`, `Grades`, and `MusicFiles`.
   - Configure each collection’s permissions. For example, only Admins can create or update Competition records, but both Admins and Competitors can read them.

4. **Roles & Permissions**
   - In Appwrite, define roles as Labels for use with role based routing in Next.js App Router (e.g., `admin`, `competitor`).
   - Secure endpoints and storage accordingly.

---

## Phase 3: Authentication and User Management

- **User Creation and Landing Page:**
  - Develop a main application page with options to create (register) a new user and log in.
  - Use a separate from for Login and Registration.
  - User registration form collects first name, last name, email, and password with proper validation.
  - The Main landing page will have the title 'Music Manager' with a modern music related icon beside it.
  - When creating a new user, concatenate the First and Last names as fullname for creating the User in Appwrite authentication.
  - Check when creating users. If the user is the very first user created, they will get the 'admin' role (label), otherwise the user is created with the 'competitor' default role (Label).
  - **Login and Role-Based Routing:**
  - Implement authentication using Appwrite Authentication.
  - After login, check the user role (Label) from appwrite and route:
    - Competitor → Competitor Dashboard (create a temporary default dashboard page)
    - Admin → Admin Dashboard (create a temporary default dashboard page)
- **Global Navigation:**
  - Include a circular, state-dependent global Login/Logout button accessible on all pages that indicates the current login state. If clicked then log the user out and route to the login page. If already logged out, just route to the login page.
- **Error Handling:**
  - Provide clear, user friendly, error messages and loading states throughout the authentication flow, using the forms and toasts where appropriate.

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
