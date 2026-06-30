# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A portfolio CMS with a NestJS + Prisma + PostgreSQL backend and a Next.js 16 frontend. Both layers are active. The backend exposes a REST API; the frontend is an authenticated admin panel that talks to the backend through a BFF (Next.js Route Handlers acting as a server-side proxy).

```
portfolio-manager/
├── backend/     # NestJS REST API + Prisma
├── frontend/    # Next.js admin panel (BFF pattern)
└── docker-compose.yml
```

## Commands

### Backend (run from `backend/`)

```bash
npm run start:dev           # Watch mode (loads .env.development)
npm run build               # Compile TypeScript

npm run test                # All unit tests
npm run test:watch          # Watch mode
npm run test:cov            # With coverage
npm run test:e2e            # E2E tests (needs Docker Compose PostgreSQL on port 55432)
npm run test -- --testPathPattern=users  # Single test file

npm run lint                # ESLint with auto-fix

npm run prisma:dev:migrate  # Run migrations
npm run prisma:dev:generate # Regenerate Prisma client after schema changes
npm run prisma:dev:studio   # Prisma Studio UI
```

### Frontend (run from `frontend/`)

```bash
npm run dev        # Dev server on port 3001
npm run build      # Production build
npm run lint       # ESLint
npm run test:run   # Unit tests (Vitest, one-shot)
npm run test       # Unit tests (watch mode)
npm run test:e2e   # E2E tests (Playwright)
```

### Full stack (from repo root)

```bash
docker compose up --build   # Start everything (backend :3000, frontend :3001, db :5432)
docker compose up -d db     # Start only PostgreSQL for local dev
```

## Backend Architecture

### Module Pattern

Every feature module follows this structure:

```
modules/{feature}/
├── {feature}.controller.ts     # HTTP handlers + guards
├── {feature}.service.ts        # Business logic
├── {feature}.module.ts         # DI wiring
├── dto/                        # class-validator DTOs
├── entities/                   # TypeScript interfaces/types
└── repository/
    ├── {feature}.repository.ts              # Prisma implementation
    └── {feature}-in-memory.repository.ts   # In-memory for unit tests
```

Services depend on repository interfaces, not concrete Prisma repositories.

### Authentication Flow

1. Register → 6-digit email verification token (30-min expiry) sent via Nodemailer
2. Verify email → account becomes ACTIVE
3. Login → JWT issued (payload: `sub`, `role`, `status`)
4. Protected routes: `JwtAuthGuard` → `ActiveUserGuard` → `UserOwnershipGuard` or `AdminGuard`

JWT secret and email config come from `.env.development` / `.env.production` via `@nestjs/config`.

### Guards (`src/modules/auth/guards/`)

| Guard | Purpose |
|---|---|
| `JwtAuthGuard` | Validates Bearer JWT |
| `ActiveUserGuard` | Rejects non-ACTIVE users |
| `UserOwnershipGuard` | Ensures user accesses only their own data |
| `AdminGuard` | Role-based access for admin-only endpoints |

### Public vs Protected Endpoints

`PublicModule` (`src/modules/public/`) exposes read-only portfolio data with no authentication. All write/mutate endpoints require the JWT stack.

### File Uploads

`UploadsModule` stores files at `uploads/{userId}/` on disk (Multer). Only jpg/jpeg/png/gif allowed. Files are linked via the `f_images` and `f_profile_picture` tables.

### Database

Prisma + PostgreSQL. Schema at `backend/prisma/schema.prisma`. Table naming: `f_` prefix for entity tables, `d_` prefix for lookup tables (e.g. `d_roles`, `d_status`, `f_projects`).

After any schema change, run `npm run prisma:dev:generate`.

E2E tests use a separate database on port 55432 (see `docker-compose.e2e.yml`).

### Backend Testing

Unit tests use `Test.createTestingModule()` and inject in-memory repositories — no database touched. E2E tests live in `backend/test/` and use `supertest`.

## Frontend Architecture

### Next.js App Router Structure

```
src/
├── app/
│   ├── (auth)/          # Route group: login, register, verify-email (unauthenticated)
│   ├── (dashboard)/     # Route group: authenticated admin panel
│   │   ├── dashboard/
│   │   └── projects/
│   └── api/             # BFF route handlers (server-side proxy to backend)
│       ├── auth/
│       ├── projects/
│       └── ...
├── features/            # Feature slices (auth, dashboard, projects)
├── components/          # Shared UI (layout, ui primitives, feedback)
└── lib/
    ├── api/
    │   ├── backend.ts   # Typed fetch helpers that call the NestJS API
    │   └── bff.ts       # BFF response normalization and 401 session clearing
    ├── auth/            # Session cookie handling (HttpOnly cookie: pm_session)
    └── query/           # TanStack Query setup
```

### BFF Pattern

The browser never calls the NestJS backend directly. All API calls go through Next.js Route Handlers (`app/api/`), which forward requests to the backend using the session JWT stored in an HttpOnly cookie. `src/lib/api/bff.ts` handles response passthrough and auto-clears the session on 401.

### Middleware (proxy)

`src/proxy.ts` (used as Next.js middleware) guards protected routes. It checks for the `pm_session` cookie and redirects unauthenticated requests to `/login`, and authenticated users away from auth pages to `/dashboard`.

### Frontend Testing

- Unit/integration: Vitest + Testing Library (`test:run`)
- E2E: Playwright (`test:e2e`) — covers desktop and mobile viewports

### Important: Next.js Version

This project uses **Next.js 16**, which has breaking changes from common training data. Before writing any Next.js code, check `node_modules/next/dist/docs/` for the relevant guide (noted in `frontend/AGENTS.md`).

## Environment

### Backend (`.env.development` in `backend/`)

- `JWT_SECRET`
- `DATABASE_URL` (PostgreSQL connection string)
- SMTP credentials (Mailtrap configured for dev)
- `FRONTEND_URL`, `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional for dev)

### Frontend (`.env.local` in `frontend/`)

- `BACKEND_URL` (internal URL the BFF uses to reach NestJS)
- `NEXT_PUBLIC_APP_URL`
- `SESSION_COOKIE_NAME` (default: `pm_session`)
