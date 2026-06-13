# Portfolio Manager Frontend

Next.js frontend for Portfolio Manager.

## Requirements

- Node.js 20.19.0 or newer
- npm

## Setup

Install dependencies and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Start the development server:

```powershell
npm run dev
```

The application is available at <http://localhost:3001>.

## Commands

```powershell
npm run dev
npm run build
npm run start
npm run lint
npm run test:run
npm run test:e2e
```

## Structure

- `src/app/`: App Router layouts, pages, and global styles
- `src/components/ui/`: shared shadcn/ui components
- `src/test/`: Vitest setup and test utilities
- `e2e/`: Playwright end-to-end tests
