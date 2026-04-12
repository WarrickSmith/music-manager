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
- In-browser audio playback and file download
- Dark/light theme with cookie persistence
- Appwrite resource initialisation from admin dashboard
- Responsive mobile-first design
