# Music Manager

A browser-based platform where Competitors can upload music files for their competitions, and Admins can manage Competitions, Grades, and Users.

## Tech Stack

- Next.js 15+ with TypeScript and App Router
- Turbopack for faster development
- shadcn/UI components for UI consistency
- Appwrite for Backend Services (Database, Storage, Authentication)
- Tailwind CSS for styling
- React Icons for icons

## Project Structure

```
music-manager/
├── src/
│   ├── app/              # App Router pages and layouts
│   ├── components/       # React components
│   │   └── ui/          # shadcn/UI components
│   └── lib/             # Utility functions and configurations
├── public/              # Static assets
└── .env.local          # Environment variables (gitignored)
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd music-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   - Copy `.env.local.example` to `.env.local`
   - Fill in your Appwrite credentials

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Guidelines

- **Code Style**: Follow TypeScript best practices and functional programming principles
- **Components**: Use shadcn/UI components for consistent UI
- **State Management**: React hooks and contexts for state
- **Data Model**:
  - Competitions (name, dates, active status)
  - Grades (name, description)
  - Users (admin/competitor roles)
  - Music Files (storage and metadata)

## Branch Strategy

- `main`: Production-ready code
- `dev`: Development branch
- `feature/*`: New features
- `fix/*`: Bug fixes

## Available Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Create production build
- `npm start`: Run production server
- `npm run lint`: Run ESLint
