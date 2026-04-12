# Music Manager — Project Overview

> **Generated:** 2026-04-12 | **Scan Level:** Deep

## Executive Summary

Music Manager is a web application built for the ice skating community. It allows **Competitors** (ice skaters) to upload and manage music files for competitions, and **Admins** to manage competitions, grades, users, and submitted music files. The application is built as a Next.js full-stack monolith using server-side Appwrite SDK for all backend operations.

## Purpose and Domain

- **Domain:** Ice skating competition music management
- **Users:** Competitors (skaters) and Administrators
- **Core Workflow:** Admin creates competitions with grades → Competitors upload music files for specific competition/grade combinations → Admin reviews and manages submissions

## Technology Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.3 |
| Language | TypeScript | 6.0.2 |
| UI Library | React | 19.2.5 |
| CSS Framework | Tailwind CSS | 4.2.2 |
| Component Library | shadcn/ui (new-york style) | Latest |
| Backend/BaaS | Appwrite (server-side Node.js SDK) | 23.1.0 |
| Form Handling | react-hook-form + Zod | 7.72.1 / 4.3.6 |
| Toast Notifications | Sonner | 2.0.7 |
| Icons | Lucide React | 1.8.0 |
| Audio Metadata | music-metadata | 11.12.3 |
| Bundler | Turbopack (dev) | Built into Next.js 16 |

## Architecture Summary

- **Type:** Full-stack monolith (Next.js App Router)
- **Pattern:** Server Components + Server Actions (no REST API routes)
- **Authentication:** Cookie-based sessions via Appwrite, server-side only
- **Data Layer:** Appwrite Database (3 collections) + Appwrite Storage (1 bucket)
- **Rendering:** Server-side rendering with `force-dynamic` for all routes
- **Deployment:** Docker standalone build → private Zot registry → Portainer

## User Roles

| Role | Access | Route |
|---|---|---|
| Admin | Full CRUD on competitions, grades, users, music files; profile management | `/admin/dashboard` |
| Competitor | Upload/download/delete own music files; profile management | `/dashboard` |

## Key Features

- Email/password authentication with role-based routing
- Competition lifecycle management (create, activate/deactivate, delete with cascade)
- Grade management with default templates (NZ ice skating grade structure) and cloning from existing competitions
- Music file upload with automatic metadata extraction (duration), standardised naming, and file type validation
- In-browser audio playback
- Dark/light theme support (cookie-persisted)
- Appwrite resource initialization from within the app (admin UI)
- Responsive mobile-first design

## Repository Structure

- **Single repository** — monolith architecture
- **Primary language:** TypeScript
- **Entry point:** `src/app/layout.tsx` (root layout)

See [Source Tree Analysis](./source-tree-analysis.md) for detailed directory structure.
See [Architecture](./architecture.md) for detailed architectural documentation.
