# Music Manager

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles -- Competitor and Admin -- the application supports file management, user administration, and competition scheduling.

## Technology Stack

- **Next.js 16** with TypeScript 6 (App Router, Server Actions, Turbopack)
- **React 19** with Server Components
- **Tailwind CSS 4** with oklch colour tokens
- **shadcn/ui** components (new-york style, Radix UI primitives)
- **Appwrite** for backend database, storage, and user management (server-side Node.js SDK v23)
- **Zod 4** + react-hook-form for form validation
- **Sonner** for toast notifications
- **Lucide** for icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local` for `npm run dev`, or in `.env` for Docker and Portainer deployments
4. Provision Appwrite resources: `npm run setup:appwrite` (or use the in-app admin initialisation UI)
5. Run the development server: `npm run dev`

See [docs/development-guide.md](docs/development-guide.md) for detailed setup instructions.

## Deployment

- GitHub Actions publishes `registry.wsapz.com/music-manager:latest` from `.github/workflows/publish-image.yml` on pushes to `main` and manual runs.
- `docker-compose.yml` is the Portainer stack definition. It pulls the published image from Zot and expects Portainer stack variables to be imported from the project `.env` file before deployment.
- The GitHub workflow only requires the `REGISTRY_PASSWORD` repository secret for Zot login.
- Runtime configuration stays in the Portainer stack `.env` import, including `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_COMPETITIONS_COLLECTION_ID`, `APPWRITE_GRADES_COLLECTION_ID`, `APPWRITE_MUSIC_FILES_COLLECTION_ID`, and `APPWRITE_BUCKET_ID`.

See [docs/deployment-guide.md](docs/deployment-guide.md) for detailed deployment instructions.

## Project Structure

- `src/app/` -- Next.js App Router pages, layouts, and server actions
- `src/components/` -- Reusable UI components (shadcn/ui + custom)
- `src/lib/` -- Utility functions, Appwrite SDK setup, auth service
- `src/hooks/` -- Custom React hooks
- `scripts/` -- Appwrite setup and provisioning scripts
- `docs/` -- Project documentation ([docs/index.md](docs/index.md))

## Authentication and Role-based Access

The application uses Appwrite for authentication and role-based access control. User roles are assigned as Labels in Appwrite (`admin` or `competitor`), and the application uses role-based routing to direct users to the appropriate dashboard. The first registered user is automatically assigned the admin role.

## Branching Strategy

- `main` -- Production branch (triggers CI/CD)
- `dev` -- Development branch
- `feature/*` / `feat/*` -- Feature branches

## Features

- Email/password authentication with cookie-based sessions
- Role-based access control and routing (Admin, Competitor)
- Competition lifecycle management (create, activate/deactivate, cascade delete)
- Grade management with default NZ ice skating templates and competition cloning
- Music file upload with automatic metadata extraction and standardised naming
- In-browser audio playback with a shared mini player (seek bar, one track at a time) and file download
- Upload deadlines per competition: competitors are locked out of upload, replace and delete afterwards, admins are not
- One music file per skater per grade, with a confirmed replace that only removes the old file once the new one is saved
- Entries per grade and a missing-music view for admins, with a copyable list; competitors see music still needed
- Admin zip export of a competition's music, numbered in running order with a manifest
- Advice on silence at the start of a track when uploading
- Dark/light theme with cookie persistence
- Appwrite resource initialisation from admin dashboard
- Responsive mobile-first design

## Security notes

- Every server action and file route checks the signed-in user on the server; see `docs/api-contracts.md` (Access policy).
- The storage bucket is private. Run Setup once after upgrading to make an existing bucket private.
- Uploads are decoded strictly with ffmpeg; files that Edge or Chrome would stop playing part-way through are offered a one-click repair.
- Uploads are checked by content (real MP3, WAV, M4A or AAC), not by file name.
- Sign-in, registration and password change are rate limited in memory (per process; see the API docs for limits).
- Not addressed here: registration is open and the first registered user becomes an admin. Review that before exposing a fresh install publicly.
