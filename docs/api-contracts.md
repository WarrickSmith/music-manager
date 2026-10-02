# Music Manager — Server Actions Reference

> **Generated:** 2026-04-12

All backend operations are implemented as Next.js Server Actions (`'use server'`). There are no REST API routes. Actions are located in `src/app/actions/` and are called directly from components.

## Auth Actions (`auth-actions.ts`)

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `loginAction` | `FormData` (email, password) | `{ success, redirectTo? }` or `{ error }` | Authenticates user, sets session cookie, returns role-based redirect path |
| `registerAction` | `FormData` (email, password, firstName, lastName) | `{ success, redirectTo?, message? }` or `{ error }` | Creates user account, assigns role (first user → admin, others → competitor) |
| `logoutAction` | — | `{ success, redirectTo }` or `{ error }` | Deletes Appwrite session and clears cookie |

## Competition Actions (`competition-actions.ts`)

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `getCompetitions` | — | `Document[]` | Lists all competitions ordered by year (desc), name (asc) |
| `createCompetition` | `{ name, year, active, useDefaultGrades, cloneFromCompetitionId? }` | `Document` | Creates competition with optional grade seeding |
| `updateCompetitionStatus` | `competitionId, active` | `Document` | Toggles competition active/inactive |
| `deleteCompetition` | `competitionId` | `true` | Cascade deletes competition + all grades + all music files (storage & DB) |
| `getActiveCompetitions` | — | `Document[]` | Lists only active competitions (for competitor views) |
| `getGradesForCompetition` | `competitionId, category?` | `Document[]` | Lists grades for a competition, optionally filtered by category |
| `getGradeCategoriesForCompetition` | `competitionId` | `string[]` | Returns unique sorted category names for a competition |

## Grade Actions (`grade-actions.ts`)

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `getGradesByCompetition` | `competitionId` | `Document[]` | Lists all grades for a competition (up to 100) |
| `createGrade` | `{ name, category, segment, competitionId }` | `Document` | Creates a new grade |
| `updateGrade` | `gradeId, { name?, category?, segment? }` | `Document` | Updates grade fields |
| `deleteGrade` | `gradeId` | `true` | Deletes a grade |

## Music File Actions (`music-file-actions.ts`)

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `getUserMusicFiles` | `userId` | `Document[]` | Lists a user's files ordered by upload date (desc) |
| `getAllMusicFiles` | — | `Document[]` | Lists all files with pagination (admin use) |
| `uploadMusicFile` | `FormData` (file, competitionId, gradeId, userId, userName, duration?) | `{ success, musicFile }` | Validates file type, extracts metadata, renames file, uploads to storage, creates DB record |

> The upload form does not call this action. It posts the same `FormData` to `POST /api/music/upload` with `XMLHttpRequest` so the browser can show real byte-level progress. The route returns `{ success: true, musicFile }` or `{ success: false, error }` with status 400 (validation) or 500. Both paths share `storeMusicFile` in `src/lib/music/upload-service.ts`.
| `deleteMusicFile` | `fileId, musicFileId` | `{ success }` | Deletes file from storage and DB record |
| `getMusicFileDownloadUrl` | `fileId` | `{ url }` | Generates authenticated download URL via Appwrite admin mode |
| `getMusicFileViewUrl` | `fileId` | `{ url }` | Generates public streaming URL with cache-busting |

## User Actions (`user-actions.ts`)

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `getAllUsers` | — | Enhanced `User[]` | Lists all users with role info and name preferences |
| `updateUserRole` | `userId, role` | `true` | Changes user role label (admin/competitor) |
| `updateUserStatus` | `userId, active` | `true` | Activates or blocks a user account |
| `deleteUser` | `userId` | `true` | Cascade deletes user + all their music files (storage & DB) |
| `getCurrentUserProfile` | — | Enhanced `User` | Gets current authenticated user's profile with preferences |
| `getServerSession` | — | `{ userId }` | Returns current user's ID from session |
| `updateUserProfile` | `{ firstName, lastName, phone }` | `true` | Updates name (auth + prefs) and phone number |
| `getUserProfile` | `userId` | `{ id, email, name, prefs }` | Gets any user's basic profile |
| `updateCompetitorProfile` | `userId, { name?, prefs? }` | `{ success }` | Updates competitor name and preferences |
| `changePassword` | `{ currentPassword, newPassword }` | `true` | Verifies current password then updates |

## Common Patterns

### Initialisation Check
Most read actions call `checkAppwriteInitialization()` first and return empty results if Appwrite resources aren't set up yet. This gracefully handles the first-run scenario.

### Pagination
Appwrite limits queries to 100 documents. The `getAllDocuments()` utility (defined in `competition-actions.ts` and `user-actions.ts`) handles pagination transparently using offset-based iteration.

### Serialisation
All actions returning Appwrite documents use `toPlainObject()` (a `JSON.parse(JSON.stringify())` wrapper) to strip SDK class prototypes before crossing the Server→Client Component boundary.

### Path Revalidation
Mutation actions call `revalidatePath()` to invalidate Next.js cached pages after data changes.
