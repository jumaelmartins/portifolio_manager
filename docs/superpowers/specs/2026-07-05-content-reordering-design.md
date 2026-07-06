# Content Reordering (Drag-and-Drop) — Design

> **Date:** 2026-07-05
> **Phase:** Fase 5 — Polimento e Extras (item "Reordenação de itens (drag-and-drop)")
> **Status:** Design approved — pending implementation plan

## Goal

Let an authenticated user manually reorder their portfolio content by
drag-and-drop, with the saved order acting as the single source of truth for
display order in **both** the dashboard and the public portfolio site.

## Scope

Six content entities become reorderable:

1. Projects
2. Experience
3. Education
4. Courses
5. Custom sections
6. Custom section items (within a section)

**Out of scope:** Categories and Technologies (global lookups, not
site-displayed content). Soft-delete (separate Fase 5 item).

## Context (current state)

- `custom_section` and `custom_section_item` already have an `order Int
  @default(0)` column; the public module already reads them
  `orderBy: { order: 'asc' }`. The custom-sections dashboard view already
  defaults to a "Manual order" sort (Task 11 of the pagination feature).
- `f_projects`, `f_experience`, `f_education`, `f_courses` have **no**
  ordering column. The public module returns them in default (insertion)
  order — no `orderBy`.
- The dashboard list pages sort/search/paginate client-side via the shared
  `useListControls<T>` hook (page size 10), the single writer of the URL
  query string (`q`, `sort`, `page`).
- No drag-and-drop library is installed. React 19.2.4, Next 16.2.9. The
  Playwright e2e suite tests a mobile (Pixel 7) viewport — native HTML5 DnD
  does not work on touch, so a touch-capable library is required.
- Write BFF handlers already call `revalidatePortfolio()` (on-demand ISR
  revalidation) on their success path (Fase 4).

## Decisions

| Decision | Choice |
|---|---|
| Reorder mechanism | Uniform per-module (mirrors the pagination rollout) |
| DnD library | `@dnd-kit` (sortable) — touch + keyboard + a11y |
| Order source of truth | The `order` column — drives dashboard **and** public site |
| Interaction model | "Manual order" is a sort option; DnD active only under it |
| Under manual order | Pagination **and** search are hidden; full list rendered draggable |
| Backfill of existing rows | `order = ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1` |
| Reorder request contract | Full ordered id set for the resource; backend rejects partial/extra/dup |
| Persistence UX | Optimistic on drop; rollback + `toast.error` on failure |

## Architecture

### Backend — data model & migration

- Add `order Int @default(0)` to `f_projects`, `f_experience`,
  `f_education`, `f_courses`. (`custom_section` / `custom_section_item`
  already have it.)
- Same migration backfills each table via raw SQL:
  `order = ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC)
  - 1`. Every user's rows get `0..n-1` in creation order, preserving the
  current public appearance (insertion order ≈ `created_at`).
- `order` is scoped per user (`user_id`); for items, per section
  (`section_id`).

### Backend — reorder endpoints (one per module)

- `PATCH /projects/reorder`, `/experience/reorder`, `/education/reorder`,
  `/courses/reorder`, `/custom-sections/reorder` — body
  `{ ids: number[] }` = the complete ordered list of the authenticated
  user's ids for that resource.
- Items: `PATCH /custom-sections/:sectionId/items/reorder` — body
  `{ ids: number[] }`.
- DTO `ReorderDto { ids: number[] }` validated with class-validator:
  `@IsArray()`, `@ArrayNotEmpty()`, `@IsInt({ each: true })`.
- Guards: `JwtAuthGuard → ActiveUserGuard`. Ownership is enforced **in the
  service** (the existing `UserOwnershipGuard` validates a single `:id`
  param; reorder receives a list).

**Service correctness rule (key invariant):**

1. Load the set of ids the authenticated user owns for the resource
   (items: the ids belonging to the owned section).
2. Assert the received `ids` equals that set **exactly** — same elements,
   none missing, none extra, no duplicates. Mismatch → `400 Bad Request`.
   Because "Manual order" renders the full list (no pagination), the client
   always submits the complete set; this prevents order drift and cross-user
   tampering.
3. In a `$transaction`, update each row: `order = index in the list`.
4. Return the reordered list (200) for the client to reconcile.

### Backend — ordered reads (lists + public)

- Dashboard list endpoints for projects/experience/education/courses:
  include `order` in the response select/entity/DTO (currently omitted —
  the column was unused) and read `orderBy: { order: 'asc' }`. Custom
  sections already exposes `order` to the frontend.
- Public module (`public.service.ts`): add `orderBy: { order: 'asc' }` to
  `f_projects`, `f_education`, `f_courses`, `f_experience`. Custom sections
  and their items already order by `order`. Public payload need not expose
  `order` — ordering the query is enough.

### Frontend — shared primitives

- **New deps:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`,
  `@dnd-kit/modifiers` (vertical-axis restriction).
- **`SortableList`** (`components/ui/sortable-list.tsx`): wraps
  `DndContext` + `SortableContext`. Sensors: Pointer (mouse/touch) +
  Keyboard (a11y). Vertical-axis modifier. Render-prop for each row/card.
  Fires `onReorder(newIds: number[])` on drag-end. Per-item drag handle
  (`GripVertical` from lucide). Keyboard: focus handle → space to lift →
  arrows to move → space to drop (dnd-kit default).
- **`useReorder`** hook: a TanStack Query mutation. On drag-end it reorders
  the cached list immediately (optimistic), `PATCH`es the BFF, and on error
  rolls back + `toast.error`. On success it reconciles (invalidate). No
  success toast — the drag itself is the feedback.

### Frontend — integration with `useListControls`

- Add a "Manual order" sort option (sort key `order`, label "Manual order")
  to projects/experience/education/courses
  (`compare: (a, b) => a.order - b.order`). Custom sections already has it.
  This is an **added, non-default** option: the existing default sort of
  each list is unchanged (projects/experience/education/courses keep their
  current date-based default; custom sections keeps its existing
  "Manual order" default). The user opts into reordering by selecting it.
- When `sortKey === "order"` (manual): the view renders the **full**
  filtered+sorted list via `SortableList` (pagination bypassed, DnD active).
  Other sorts: paginated read-only (current behavior).
- The hook gains one accessor exposing the full post-search/sort list
  (today it exposes only `pageItems`). Minimal addition.
- **Search under manual order:** selecting "Manual order" hides the
  `SearchInput` and the pagination controls — the user is *arranging*, not
  filtering. Rationale: the backend requires the complete id set; a filtered
  subset would violate the exact-set rule. Switching to another sort
  restores search + pagination.

### Frontend — BFF routes

- `PATCH /api/{resource}/reorder` forwards to the backend
  `PATCH /{resource}/reorder` with the session JWT, following the existing
  BFF pattern. Items: `/api/custom-sections/[sectionId]/items/reorder`.
- These are write handlers → each calls `revalidatePortfolio()` on success
  so the public ISR site reflects the new order (without it, order updates
  wait for the 3600s TTL).

### Frontend — surfaces (6)

- Projects, experience, education, courses list pages (desktop table +
  mobile list; rows become sortable).
- Custom sections card grid (2-col).
- Custom section items inside the `ItemsDrawer`.

## Data flow

```
User drags row in "Manual order" mode
  → SortableList.onReorder(newIds)
  → useReorder: optimistic cache reorder + PATCH /api/{resource}/reorder
  → BFF forwards to backend PATCH /{resource}/reorder (session JWT)
  → service validates exact id set, $transaction sets order = index
  → BFF success → revalidatePortfolio()
  → dashboard cache reconciled; public ISR site now orders by `order`
On error → rollback optimistic update + toast.error
```

## Error handling & edge cases

- `PATCH` failure → optimistic rollback + `toast.error`.
- Stale set (concurrent add/remove in another tab) → backend `400` →
  toast ("list changed, refreshing") + refetch.
- 0–1 items → nothing to drag; handle hidden/inert.
- Manual order renders the full list (no pagination) — acceptable for
  small portfolios; recorded as a known limitation.

## Testing

- **Backend unit:** exact-set validation (missing/extra/duplicate → 400),
  transaction sets `order = index`, ownership (id from another user →
  rejected). In-memory repos.
- **Backend e2e:** reorder happy path + 400 (bad set) + 401 (unauth) — at
  least projects and custom-section items.
- **Frontend unit (Vitest):** `SortableList` fires `onReorder` with the new
  order; `useReorder` optimistic + rollback; per view, "Manual order" hides
  search/pagination and renders the full draggable list. dnd-kit under jsdom
  needs pointer-event care (global `testTimeout` already 20s).
- **Frontend e2e (Playwright):** reorder a list → reload → order persists;
  public portfolio reflects the order. Chromium + mobile.

## Decomposition & execution

One spec. The feature is two sequential layers (frontend depends on
backend), not independent subsystems. The implementation plan will likely
group a backend block (migration + 6 endpoints + ordered reads,
independently testable) before a frontend block (primitives + 6 surfaces +
BFF). Execution via subagent-driven-development, as with the pagination
feature.

## Global constraints (carry into the plan)

- Never implement on `master` — branch first.
- Commit trailer exactly: `Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>`.
- Next.js 16 has breaking changes — consult `node_modules/next/dist/docs/`
  before writing Next.js code (`frontend/AGENTS.md`).
- After any Prisma schema change, run `npm run prisma:dev:generate`.
- Backend module pattern: service depends on a repository interface;
  provide an in-memory repository for unit tests.
- `order` is per-user (per-section for items); the reorder service must
  enforce ownership itself (guards validate single-`:id` routes only).
- Reorder BFF handlers must call `revalidatePortfolio()` on success.
