# Music Manager

## Overview

Music Manager is an application designed for Ice Skaters to upload and manage music files provided by Competitors for each competition grade. With two primary user roles – Competitor and Admin – the application supports file management, user administration, and competition scheduling.

## Technology Stack

- Next.js 15+ with TypeScript
- shadcn/UI components
- Appwrite for backend and storage (server-side Node.js SDK)
- Sonner for toast notifications
- React Icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`

## Project Structure

- `src/app`: Next.js App Router pages and layouts
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and Appwrite configuration
- `src/hooks`: Custom React hooks
- `src/types`: TypeScript type definitions
- `Docs`: Project documentation and Appwrite setup files

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
