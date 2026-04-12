# Music Manager

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles – Competitor and Admin – the application supports file management, user administration, and competition scheduling.

## Technology Stack

- Next.js 15+ with TypeScript
- shadcn/UI components
- Appwrite for backend and storage (server-side Node.js SDK)
- Sonner for toast notifications
- Lucide for icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local` for `npm run dev`, or in `.env` for Docker and Portainer deployments
4. Run the development server: `npm run dev`

## Deployment

- GitHub Actions publishes `registry.wsapz.com/music-manager:latest` from `.github/workflows/publish-image.yml` on pushes to `main` and manual runs.
- `docker-compose.yml` is the Portainer stack definition. It pulls the published image from Zot and expects Portainer stack variables to be imported from the project `.env` file before deployment.
- The GitHub workflow only requires the `REGISTRY_PASSWORD` repository secret for Zot login.
- Runtime configuration stays in the Portainer stack `.env` import, including `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_COMPETITIONS_COLLECTION_ID`, `APPWRITE_GRADES_COLLECTION_ID`, `APPWRITE_MUSIC_FILES_COLLECTION_ID`, and `APPWRITE_BUCKET_ID`.

## Project Structure

- `src/app`: Next.js App Router pages, layouts, and server actions
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and Appwrite configuration
- `src/hooks`: Custom React hooks
- `scripts`: Appwrite setup and admin scripts
- `docs`: Project documentation and reference materials

## Authentication and Role-based Access

The application uses Appwrite for authentication and role-based access control. User roles are assigned as Labels in Appwrite, and the application uses role-based routing to direct users to the appropriate dashboard based on their role.

## Branching Strategy

- `main`: Production branch
- `dev`: Development branch
- `feature/*`: Feature branches

## Features

- Authentication and user management
- Role-based access control (Admin, Competitor)
- Music file upload and management
- Competition and grade management
