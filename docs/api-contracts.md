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
| `createCompetition` | `{ name, year, active, useDefaultGrades, cloneFromCompetitionId?, uploadDeadline? }` | `Document` | Creates competition with optional grade seeding and upload deadline |
| `updateCompetitionDeadline` | `competitionId, uploadDeadline \| null` | `ActionResult` | Admin only. Sets or clears the time after which competitors cannot upload, replace or delete |
| `getCompetitionDeadlines` | — | `Record<competitionId, ISO string>` | Deadlines for competitions that have one |
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
| `findExistingMusicFile` | `userId, gradeId` | `ActionResult<summary \| null>` | The skater's current file for a grade, so the upload form can warn about a replace |
| `deleteMusicFile` | `fileId, musicFileId` | `{ success: true }` or `{ success: false, error }` | Deletes file from storage and DB record. Competitors are refused after the competition's deadline; admins are not |
| `getMusicFileDownloadUrl` | `fileId` | `{ url }` | Generates authenticated download URL via Appwrite admin mode |
| `getMusicFileViewUrl` | `fileId` | `{ url }` | Generates public streaming URL with cache-busting |

## Entry Actions (`entry-actions.ts`)

Results use `ActionResult<T>` (`{ ok: true, data }` or `{ ok: false, error }`) so error messages reach the screen in production.

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `getEntryOverview` | `competitionId` | `ActionResult<{ entries, grades, files }>` | Admin only. Everything the Entries screen needs for one competition |
| `addEntries` | `{ competitionId, userId, userName, gradeIds }` | `ActionResult<{ added, skipped }>` | Admin only. Enters a skater in several grades; grades already entered are skipped |
| `removeEntry` | `entryId` | `ActionResult` | Admin only |
| `listCompetitors` | — | `ActionResult<{ id, name, email }[]>` | Admin only. Non-admin accounts, A to Z |
| `getOutstandingMusic` | `userId` | `ActionResult<OutstandingMusic[]>` | The skater's own entries in active competitions that have no music yet. Returns an empty list if entries are not set up |

## Route Handlers

| Route | Who | Description |
|---|---|---|
| `POST /api/music/upload` | Signed-in users | Upload with byte progress. Returns `409 { code: "exists", existing }` if the skater already has a file for the grade and `replace` was not set, and `403 { code: "deadline" }` for a competitor after the deadline |
| `GET /api/music/export?competitionId&order=grade\|segment` | Admins only | Streams a zip of the competition's music: files numbered in running order plus `manifest.csv`. A file that cannot be read is listed in `problems.txt`. Add `&preflight=1` for `{ count, bytes, filename }` JSON instead |

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
