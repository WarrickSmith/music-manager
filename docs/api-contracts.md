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

> The upload form does not call this action. It posts the same `FormData` to `POST /api/music/upload` with `XMLHttpRequest` so the browser can show real byte-level progress. The route returns `{ success: true, musicFile }` or `{ success: false, error }` with status 400 (validation) or 500. Both paths share `storeMusicFile` in `src/lib/music/upload-service.ts`.
| `findExistingMusicFile` | `gradeId` | `ActionResult<summary \| null>` | The signed-in user's current file for a grade, so the upload form can warn about a replace |
| `deleteMusicFile` | `musicFileId` | `{ success: true }` or `{ success: false, error }` | Owner or admin only. Deletes the stored file (taken from the record) and the DB record. Competitors are refused after the competition's deadline; admins are not |

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


## Access policy

Every server action checks the caller's session on the server before touching Appwrite (`src/lib/auth/guards.ts`). The browser's claims about who it is are never trusted.

| Policy | Meaning | Examples |
|---|---|---|
| admin | `requireAdmin()` | competition, grade and entry management, all users, all music, Setup |
| user | `requireUser()` | active competitions and grades, own profile, own delete |
| self-or-admin | `requireSelfOrAdmin(userId)` | `getUserMusicFiles`, `getUserProfile`, `getOutstandingMusic` |
| public | no session needed | `loginAction`, `registerAction`, `logoutAction`, `getServerSession` |

`tests/action-policy.test.ts` lists every exported action with its policy and fails when a new action is added without one.

Admins cannot remove their own admin role, switch off or delete their own account.

## Route handlers

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/music/upload` | signed in; same-origin only | Upload with real progress. The owner is the signed-in user (only admins may name another skater). The file's real type, extension and length come from its bytes; non-audio content, empty and oversized files (15MB) are refused. If the file would stop part-way through in a browser (a strict decode finds faults), it answers `422` with `code: 'needs-repair'`; repeat the upload with `repair=true` to store a clean re-encoded MP3 instead |
| `GET /api/music/file/[fileId]` | owner or admin; others get 404 | Streams or downloads (`?download=1`) a stored file, with Range support for seeking |
| `GET /api/music/export` | admin | Zip of music for a competition |

Unexpected errors from these routes return a short reference code; the details are written to the server log under that code.

## Rate limits

In-memory, per server process: sign-in 20 failures per IP and 5 per email per 15 minutes; registration 10 per IP per hour; password change 5 per user per 15 minutes. Behind a reverse proxy the client IP is read from `x-forwarded-for`, so make sure the proxy sets it. Limits reset on restart and are not shared between multiple instances.

## Audio repair

Some MP3 files play in desktop players but are rejected part-way through by Edge and Chrome, whose decoders are stricter. On upload the server decodes the file strictly with `ffmpeg` (`src/lib/music/audio-repair.ts`). A file with 5 or more decode problems gets a `needs-repair` answer, the upload screen explains it, and if the skater agrees the file is re-encoded to MP3 (variable bit rate, quality 2, tags kept, cover picture dropped) and the repaired copy is stored. The original is not kept.

`ffmpeg` must be installed on the server; the Docker image installs it. Without it the check is skipped and uploads behave as before. At most 2 ffmpeg jobs run at once.
