# Music Manager — Data Models

> **Generated:** 2026-04-12

## Database: MusicManagerDB (Appwrite)

The application uses Appwrite as its backend service. All database operations are performed server-side via the `node-appwrite` SDK's **TablesDB** API with API key authentication. Appwrite now calls collections *tables*, attributes *columns* and documents *rows*; this document keeps the app's original names (e.g. "Competitions Collection") where they match IDs and environment variables.

## Collections

### 1. Competitions

Stores competition definitions. Each competition has a name, year, and active/inactive status.

| Attribute | Type | Required | Description |
|---|---|---|---|
| `$id` | string | Auto | Appwrite document ID |
| `name` | string | Yes | Competition name |
| `year` | integer | Yes | Competition year |
| `active` | boolean | Yes | Whether visible to competitors |
| `uploadDeadline` | datetime | No | After this time competitors cannot upload, replace or delete their music. Empty means no deadline. Admins are never locked out. |

**Key operations:**
- List with ordering by year (desc) then name (asc)
- Filter by `active` status for competitor-facing views
- Cascade delete: removing a competition deletes all associated grades and music files

### 2. Grades

Stores grade/level definitions within competitions. Grades follow the NZ ice skating structure with name (discipline), category, and segment.

| Attribute | Type | Required | Description |
|---|---|---|---|
| `$id` | string | Auto | Appwrite document ID |
| `name` | string | Yes | Discipline (e.g., "Singles", "Ice Dance", "Pairs") |
| `category` | string | Yes | Level/age group (e.g., "Junior Girls", "Senior Men") |
| `segment` | string | Yes | Program type (e.g., "Free Skate", "Short Program") |
| `competitionId` | string | Yes | Reference to parent competition |

**Grade seeding options:**
- Default template: 80+ grades from `src/lib/appwrite/default-grades.ts` covering Singles, Adult Singles, Masters Singles, Ice Dance, Pairs, Synchronized Skating, and Showcase events
- Clone from existing competition

### 3. Music Files

Tracks uploaded music files with comprehensive denormalised metadata for efficient querying.

| Attribute | Type | Required | Description |
|---|---|---|---|
| `$id` | string | Auto | Appwrite document ID |
| `fileId` | string | Yes | Appwrite Storage file ID |
| `originalName` | string | Yes | Original uploaded filename |
| `fileName` | string | Yes | Standardised filename (without extension) |
| `storagePath` | string | Yes | Storage path (`{bucketId}/{fileId}`) |
| `competitionId` | string | Yes | Reference to competition |
| `competitionName` | string | Yes | Denormalised competition name |
| `competitionYear` | integer | Yes | Denormalised competition year |
| `gradeId` | string | Yes | Reference to grade |
| `gradeType` | string | Yes | Denormalised grade name/discipline |
| `gradeCategory` | string | Yes | Denormalised grade category |
| `gradeSegment` | string | Yes | Denormalised grade segment |
| `userId` | string | Yes | Uploading user's Appwrite ID |
| `userName` | string | Yes | Denormalised user display name |
| `uploadedAt` | string | Yes | ISO 8601 timestamp |
| `duration` | integer | No | Audio duration in seconds (extracted via music-metadata) |
| `size` | integer | Yes | File size in bytes |
| `status` | string | Yes | File status: `"ready"`, `"processing"`, or `"error"` |

**One file per skater per grade:** a skater has at most one music file for each grade. A second upload must be a confirmed replace; the old file is deleted only after the new one is stored. Indexed by `idx_user_grade` (`userId`, `gradeId`).

**Standardised file naming convention:**
```
{year}-{competition}-{category}-{segment}-{firstname}-{lastinitial}.{ext}
```
Example: `2026-nationals-junior-girls-free-skate-sarah-j.mp3`

### 4. Entries

Which skater is entered in which grade of a competition. Admins manage entries; the Entries screen compares them with the uploaded music to show whose music is missing. A skater's music counts as received when they have a music file for that grade.

| Attribute | Type | Required | Description |
|---|---|---|---|
| `$id` | string | Auto | Appwrite row ID |
| `competitionId` | string (36) | Yes | Reference to competition |
| `gradeId` | string (36) | Yes | Reference to grade |
| `userId` | string (36) | Yes | The entered skater's Appwrite user ID |
| `userName` | string | Yes | Denormalised skater name |

A unique index on (`competitionId`, `gradeId`, `userId`) stops the same skater being entered twice in a grade. The table ID comes from `APPWRITE_ENTRIES_COLLECTION_ID` (default `entries`).

**Upgrading an existing project:** open the admin **Setup** tab and run setup. It adds the `uploadDeadline` column, the `idx_user_grade` index and the entries table without touching existing data. Until then the Entries screen and deadlines explain that setup is needed; everything else keeps working.

## Storage

### MM Files Bucket (`mmfiles`)

Appwrite Storage bucket for all music files.

- **Accepted types:** `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/x-m4a`, `audio/mp4`, `audio/aac`, `audio/x-aac`
- **Max upload size:** 15 MB (configured via Next.js `serverActions.bodySizeLimit`)
- **Permissions:** Public read access for audio streaming; write via server-side API key

## Entity Relationships

```
User (Appwrite Users)
  │
  ├──uploads──▶ Music File (*)
  │
Competition (1)
  │
  ├──has──▶ Grade (*)
  │            │
  │            ├──has──▶ Music File (*)
  │            │
  └────────────┴──referenced by──▶ Music File (*)
```

1. A **Competition** has many **Grades**
2. A **Grade** has many **Music Files**
3. A **Music File** belongs to one Competition, one Grade, and one User
4. Deleting a Competition cascades to all its Grades and Music Files (including storage)
5. Deleting a User cascades to all their Music Files (including storage)

## Denormalisation Strategy

The Music Files collection deliberately duplicates data from Competitions, Grades, and Users to:
- Avoid multi-collection joins (Appwrite has no join support)
- Enable efficient listing and filtering without additional queries
- Display complete file information in a single query

Trade-off: data can become stale if competition/grade names change after files are uploaded.

## Authentication & Users

Users are managed via Appwrite's built-in Users service (not a custom collection):

| Property | Usage |
|---|---|
| `email` | Login credential |
| `password` | Login credential (hashed by Appwrite) |
| `name` | Full name (`firstName lastName`) |
| `labels` | Role assignment: `["admin"]` or `["competitor"]` |
| `prefs.firstName` | First name (stored as preference) |
| `prefs.lastName` | Last name (stored as preference) |
| `phone` | Optional phone number (international format) |
| `status` | Account active/blocked (managed by admin) |

**Role assignment rules:**
- First user ever registered → `admin`
- All subsequent users → `competitor`
- Admins can promote/demote users via the admin dashboard
