# Soft-Delete / Archiving — Design

> **Date:** 2026-07-20
> **Phase:** Fase 5 — Polimento e Extras (item "Soft-delete / arquivamento")
> **Status:** Design approved — pending implementation plan

## Goal

Let an authenticated user **archive** and **trash** their portfolio content
instead of hard-deleting it, with two independent states:

- **Archived** — hidden from the public portfolio site, but still active and
  editable in the dashboard.
- **Trash (lixeira)** — restorable, hidden from **both** the dashboard main
  list and the public site. Emptied only by explicit manual purge.

## Scope

All **six** content entities gain both states:

1. Projects (`f_projects`)
2. Experience (`f_experience`)
3. Education (`f_education`)
4. Courses (`f_courses`)
5. Custom sections (`custom_section`)
6. Custom section items (`custom_section_item`)

**Out of scope:** Categories and Technologies (global lookups, not
site-displayed content). Scheduled/automatic purge (YAGNI — manual purge
only). Bulk multi-select actions (single-row actions only).

## Context (current state)

- All six entities **hard-delete** today: `DELETE /{resource}/:id` calls
  Prisma `.delete()`. No soft-delete columns exist.
- Only `f_projects` has a uniqueness constraint:
  `@@unique([f_userId, title])`. `custom_section` / `custom_section_item`
  have `onDelete: Cascade` (deleting a section removes its items).
- An `audit_log` table exists. Auditing is a **Prisma middleware**
  (`src/database/prisma-audit.middleware.ts`), not per-service:
  `AUDITED_MODELS` already includes all six content models; `ACTION_MAP`
  maps `create→CREATE`, `update→UPDATE`, `delete→DELETE`. Audit context
  (user id + ip) is set by `AuditInterceptor`.
- `projects` module has **no in-memory repository** — its service uses the
  Prisma `ProjectRepository` directly. Other modules follow the
  service-depends-on-repository-interface pattern with an in-memory repo.
  Test setup is per-module — match each module's existing setup.
- Dashboard list pages sort/search/paginate client-side via the shared
  `useListControls<T>` hook (page size 10), the single writer of the URL
  query string (`q`, `sort`, `page`). Reorder ("Manual order") renders the
  full unfiltered set and `PATCH`es a complete ordered id set; the backend
  (`findIdsByUser` + exact-set assert) rejects partial/extra/dup.
- Write BFF handlers call `revalidatePortfolio()` (on-demand ISR
  revalidation) on their success path.
- Prisma 6 **cannot** express partial unique indexes declaratively — a
  partial index requires a raw-SQL migration.

## Decisions

| Decision | Choice |
|---|---|
| Model | **Both, independent states** — `archived` and `trash` are separate |
| Granularity | All six entities, including individual custom-section items |
| UX surface | **Per-list state filter** — "Ativos \| Arquivados \| Lixeira" |
| Retention | **Manual purge only** — no cron/scheduler (YAGNI) |
| Data model | Two nullable timestamp columns per table: `archived_at`, `deleted_at` |
| State derivation | `deleted_at != null` → TRASH; else `archived_at != null` → ARCHIVED; else ACTIVE (**trash dominates**) |
| Restore semantics | Restore clears only `deleted_at`; item returns to its prior state (`archived_at` preserved) |
| Cascade on flag | **None** — a section flag hides its whole subtree via read filters; item flags are independent within an active section |
| Auditing | **Free** via the existing Prisma middleware — zero new wiring |

## Architecture

### Backend — data model & migration

- Add two nullable columns to all six tables:
  `archived_at DateTime?` and `deleted_at DateTime?`.
- Migration `add_soft_delete_columns`: all columns nullable → **no
  backfill** (existing rows are ACTIVE by definition). Run
  `npm run prisma:dev:generate` after.
- **State is derived**, not stored as an enum:
  - `deleted_at != null` → **TRASH** (dominates, regardless of `archived_at`)
  - else `archived_at != null` → **ARCHIVED**
  - else → **ACTIVE**

### Backend — `f_projects` unique constraint (partial index)

- Remove `@@unique([f_userId, title])` from the schema.
- `prisma migrate dev --create-only`, then hand-edit the generated SQL to a
  **partial** unique index:
  `CREATE UNIQUE INDEX "f_projects_f_userId_title_key"
   ON "f_projects" ("f_userId", "title") WHERE "deleted_at" IS NULL;`
- Effect: trashed projects don't block reusing a title; two live projects
  still can't share a title.

### Backend — read semantics (`?state` query param)

- List GET endpoints gain an optional `?state=active|archived|trash`
  (default **`active`** — byte-for-byte identical to today's behavior).
- Repository `findAll` filters by state:
  - `active`: `archived_at IS NULL AND deleted_at IS NULL`
  - `archived`: `archived_at IS NOT NULL AND deleted_at IS NULL`
  - `trash`: `deleted_at IS NOT NULL`
- `findIdsByUser` (reorder source of truth) gains
  `archived_at: null, deleted_at: null` → reorder only ever sees ACTIVE
  rows, keeping the exact-set invariant intact.
- `findByTitle` (projects create/update collision check) gains
  `deleted_at: null` → collides only with live titles.
- List responses **include** `archived_at` / `deleted_at` in the
  select/entity/DTO (as reordering added `order`) so the frontend can render
  state badges and sort Archived/Trash by timestamp.
- **Public** (`public.service.ts`): every content relation in the nested
  `getPortfolio` read gains `where: { deleted_at: null, archived_at: null }`
  → public shows only ACTIVE items. A section that is archived/trashed hides
  its whole subtree (the relation filter drops the section; its items need
  no separate cascade).

### Backend — state-transition API

Per entity `{e}` in {projects, experience, education, courses}:

| Route | Effect |
|---|---|
| `PATCH /{e}/:id/archive` | `archived_at = now()` |
| `PATCH /{e}/:id/unarchive` | `archived_at = null` |
| `DELETE /{e}/:id` (**repurposed**) | soft → `deleted_at = now()` (to trash) |
| `PATCH /{e}/:id/restore` | `deleted_at = null` (returns to prior state) |
| `DELETE /{e}/:id/purge` | **hard** Prisma `.delete()` |

Custom sections mirror the same five on `:id` (sections) **and** on
`items/:itemId` (items):
`PATCH /custom-sections/items/:itemId/{archive,unarchive,restore}`,
`DELETE /custom-sections/items/:itemId` (soft),
`DELETE /custom-sections/items/:itemId/purge` (hard).

- Guards unchanged: `JwtAuthGuard → ActiveUserGuard`; ownership enforced as
  today (services already scope by `f_userId` / role for items).
- **Route ordering:** static/suffixed routes (`:id/archive`, `:id/purge`,
  and existing `reorder`) declared **before** the bare `:id` routes.
- No cascade writes on archive/trash — read filters handle subtree hiding.
  Purge of a section relies on the schema's existing `onDelete: Cascade`.
- **Purge guard:** purge requires `deleted_at != null` (item must be in
  trash); otherwise `404 Not Found` ("not in trash").

### Backend — auditing (no new work)

The existing Prisma middleware covers all six models:

- archive / unarchive / trash / restore are Prisma `update` calls →
  logged as `UPDATE` (new_values carries the timestamp change).
- purge is a Prisma `delete` call → logged as `DELETE`.

No new audit code.

### Frontend — `useListControls` gains a `state` dimension

- New query-string param `state` (`active|archived|trash`), default
  `active` **omitted** from the URL. It joins `q`/`sort`/`page` under the
  hook (still the single query-string writer). Changing `state` resets
  `page = 1`.
- The list query (TanStack Query) includes `state` in its query key and
  fetches `?state=X`, so switching tabs refetches the correct set.
- **Reorder ("Manual order") is offered only in the Active view** — the only
  state where order is meaningful. Archived/Trash hide the "Manual order"
  sort option and default-sort by the relevant timestamp (`archived_at` /
  `deleted_at`) descending (most-recent first).

### Frontend — per-state row actions

| View | Row actions |
|---|---|
| Active | Edit · Archive · Delete (→ trash) |
| Archived | Edit · Unarchive · Delete (→ trash) |
| Trash | Restore · Delete permanently (purge) |

- "Delete permanently" (purge) goes through the existing destructive-confirm
  dialog. Trash's "Delete" (soft) needs no scary confirm — it's reversible.
- Custom-section **items** (inside `ItemsDrawer`) get the same state filter
  and the same per-state actions.

### Frontend — state filter UI

- A segmented control / tab set "Ativos | Arquivados | Lixeira" on each of
  the six surfaces (projects, experience, education, courses list pages;
  custom-sections grid; items drawer), driven by the `state` param.

### Frontend — BFF routes + revalidation

- New BFF handlers proxy each transition with the session JWT, following the
  existing pattern, for all six entities + items:
  `PATCH /api/{resource}/:id/{archive,unarchive,restore}`,
  `DELETE /api/{resource}/:id/purge`. The existing
  `DELETE /api/{resource}/:id` now forwards the soft-delete.
- The list BFF GET forwards `?state`.
- `revalidatePortfolio()` runs on success of **archive / unarchive / trash /
  restore** (they change public output). **Purge does not revalidate** — the
  item was already in trash (already invisible to the public), so purging it
  changes nothing public-facing.

## Data flow

```
User clicks "Archive" on an Active row
  → PATCH /api/{resource}/:id/archive (session JWT)
  → backend PATCH /{resource}/:id/archive → archived_at = now()
  → Prisma middleware logs UPDATE
  → BFF success → revalidatePortfolio()
  → list cache invalidated (row leaves Active, appears under Archived)
  → public ISR site no longer shows the item

User switches to "Lixeira", clicks "Restore"
  → PATCH /api/{resource}/:id/restore → deleted_at = null
  → item returns to its prior state (archived_at preserved)
  → revalidatePortfolio()

User clicks "Delete permanently" in Lixeira → confirm dialog
  → DELETE /api/{resource}/:id/purge → hard .delete() (logged DELETE)
  → no revalidate (already hidden)
```

## Error handling & edge cases

- **Restore title collision (projects):** restoring a trashed project whose
  title was reused by a live project → partial unique index rejects →
  service returns `409 Conflict`; frontend shows `toast.error`.
- **Archived + trashed item:** `deleted_at` dominates → shows in Trash;
  Restore clears only `deleted_at` → returns to Archived (not Active).
- **Purge outside trash:** service guards `deleted_at != null` → `404`.
- **Reorder never sees archived/trashed rows** (`findIdsByUser` filtered) →
  exact-set invariant holds; reorder + Active list stay consistent.
- **New items** are born ACTIVE (both timestamps null) → existing
  `order`/insertion behavior unchanged.
- Transition `PATCH`/`DELETE` failure → `toast.error` + cache reconcile.

## Testing

- **Backend unit (per module; match existing setup — projects has no
  in-memory repo, others do):** soft-delete sets `deleted_at`; archive sets
  `archived_at`; `findAll(state)` returns the right subset for each state;
  `findByTitle` excludes trashed; `findIdsByUser` excludes archived/trashed;
  restore clears only `deleted_at`; purge requires trash (404 otherwise) and
  hard-deletes.
- **Backend e2e:** full lifecycle for at least one entity
  (archive → unarchive → trash → restore → purge) + public-exclusion
  assertions (archived/trashed absent from `/public/...`) + restore-collision
  409 for projects.
- **Frontend unit (Vitest):** `useListControls` `state` dimension (param
  read/write, resets page, query key); per-state row-action rendering (right
  buttons per view); BFF handlers forward correctly and revalidate on the
  four transitions (not on purge).
- **Frontend e2e (Playwright):** archive an item → gone from Active, present
  under Archived, absent from the public site; trash → restore round-trip.
  Chromium + mobile.

## Decomposition & execution

**One spec, two sequential implementation plans** (mirrors the reordering
rollout — frontend depends on backend):

1. **Backend plan** — migrations (soft-delete columns + partial index),
   `?state` reads, five transitions per entity/items, public read filters,
   backend unit + e2e. Independently testable and mergeable.
2. **Frontend plan** — `useListControls` `state` dimension, state-filter UI,
   per-state row actions on all six surfaces, BFF transition routes +
   revalidation, frontend unit + e2e.

Auditing needs no plan work (free via middleware). Execution via
subagent-driven-development, as with prior features.

## Global constraints (carry into the plans)

- Never implement on `master` — branch first.
- Commit trailer exactly: `Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>`.
- Do not push to origin unless explicitly asked.
- Next.js 16 has breaking changes — consult `node_modules/next/dist/docs/`
  before writing Next.js code (`frontend/AGENTS.md`).
- After any Prisma schema change, run `npm run prisma:dev:generate`.
- Backend module pattern: service depends on a repository interface; provide
  an in-memory repository for unit tests **where the module already has
  one** (projects does not — it uses the Prisma repo directly).
- Static/suffixed routes declared before bare `:id` routes.
- State-change BFF handlers call `revalidatePortfolio()` on success (all
  except purge).
