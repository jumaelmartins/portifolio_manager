# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A portfolio CMS backend (NestJS + Prisma + SQLite). Frontend (Next.js) is planned but not yet started. All active work is inside `backend/`.

## Commands

All commands run from `backend/`:

```bash
# Development
npm run start:dev         # Start with watch mode (loads .env.development)
npm run build             # Compile TypeScript to dist/

# Testing
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:cov          # With coverage
npm run test:e2e          # End-to-end tests
npm run test -- --testPathPattern=users  # Run a single test file

# Linting
npm run lint              # ESLint with auto-fix

# Database
npm run prisma:dev:migrate    # Run migrations (dev)
npm run prisma:dev:generate   # Regenerate Prisma client after schema changes
npm run prisma:dev:studio     # Open Prisma Studio UI
```

## Architecture

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
    ├── {feature}.repository.ts          # Prisma implementation
    └── {feature}-in-memory.repository.ts  # In-memory implementation for tests
```

Services depend on repository interfaces, not concrete Prisma repositories. Unit tests inject the in-memory repository instead.

### Authentication Flow

1. Register → email verification token (6-digit code, 30min expiry) sent via Nodemailer
2. Verify email → account becomes ACTIVE
3. Login → JWT issued (payload: `sub`, `role`, `status`)
4. Protected routes use stacked guards: `JwtAuthGuard` → `ActiveUserGuard` → `UserOwnershipGuard` or `AdminGuard`

JWT secret and email config come from `.env.development` / `.env.production` via `@nestjs/config`.

### Database

Prisma + SQLite. Schema at `backend/prisma/schema.prisma`. Table naming convention: `f_` prefix for fact/entity tables, `d_` prefix for dimension/lookup tables (e.g. `d_roles`, `d_status`, `f_projects`).

After any schema change, run `npm run prisma:dev:generate` to regenerate the client.

### Guards (location: `src/modules/auth/guards/`)

| Guard | Purpose |
|---|---|
| `JwtAuthGuard` | Validates Bearer JWT |
| `ActiveUserGuard` | Rejects non-ACTIVE users |
| `UserOwnershipGuard` | Ensures user accesses only their own data |
| `AdminGuard` | Role-based access for admin-only endpoints |

### Public vs Protected Endpoints

`PublicModule` (`src/modules/public/`) exposes read-only portfolio data with no authentication. All write/mutate endpoints require the JWT stack.

### File Uploads

`UploadsModule` stores files at `uploads/{userId}/` on disk (Multer disk storage). Only jpg/jpeg/png/gif allowed. Files are linked to users via the `f_images` and `f_profile_picture` tables.

### Testing Pattern

Unit tests use `Test.createTestingModule()` and substitute in-memory repositories for Prisma repositories. No database is touched during unit tests. E2E tests live in `backend/test/` and use `supertest`.

## Environment

Requires `.env.development` in `backend/` with at minimum:
- `JWT_SECRET`
- `DATABASE_URL` (points to `prisma/dev.db`)
- SMTP credentials (Mailtrap configured for dev)
