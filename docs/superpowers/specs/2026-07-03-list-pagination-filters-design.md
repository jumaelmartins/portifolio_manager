# List Pagination + Advanced Filters — Design

> Fase 5 (Polimento e Extras). Status: approved, ready for implementation plan.
> Date: 2026-07-03.

## Goal

Give every dashboard list a consistent, client-side control bar: text search,
a sort control, and numbered pagination (10 items per page). Extend the
existing Projects list rather than replace it, and reuse one shared engine
across all seven lists.

## Scope

Seven lists, all under `frontend/src/app/(dashboard)/**`:

1. Projects
2. Experience
3. Education
4. Courses
5. Categories (global lookup)
6. Technologies (global lookup)
7. Custom sections

Every list receives: text search + sort control + numbered pagination.
Projects additionally keeps its existing category and technology filters.

### Out of scope

- **No backend, BFF, or database changes.** All list endpoints keep returning
  bare arrays; the BFF keeps forwarding no query string. Filtering, sorting,
  and pagination happen entirely in the browser on the already-fetched array.
- **No migration.** No new columns; sort uses fields that already exist on the
  entities (`createdAt`, `startDate`, `title`, `name`, `order`).
- Nested custom-section *items* are not filtered/paginated — only the sections
  list itself (see Custom sections nuance).
- No server-side pagination, no infinite scroll, no "load more".

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Which lists | All seven (content x4 + 2 lookups + custom sections) |
| Where processing happens | Client-side, frontend-only |
| Filter richness | Uniform text search + sort control; Projects keeps category+tech |
| Pagination UI | Numbered pages («Prev 1 2 3 Next»), 10 per page |
| State location | URL query params, shareable/bookmarkable |
| Structure | Shared hook + UI primitives (Approach A) |

Rationale: portfolio data is small (tens of items per user), so client-side is
the YAGNI choice — zero backend surface, one uniform pattern across all lists,
no response-shape churn. Scales comfortably to hundreds of items.

## Architecture

Approach A: one generic engine plus three presentational primitives. Nothing
backend or BFF changes.

```
frontend/src/lib/list-controls/
  types.ts               # SortOption<T>, ListControlsConfig<T>, ListControlsResult<T>
  use-list-controls.ts   # the engine hook

frontend/src/components/ui/
  pagination.tsx         # numbered pager, a11y
  sort-select.tsx        # sort dropdown (wraps existing <Select>)
  search-input.tsx       # search box (icon + <Input type="search">), extracted from ProjectFilters
```

Existing UI kit already provides `button`, `input`, `select`, `table`, `card`,
`badge`, `skeleton`. No pagination primitive exists — it is new.

### The engine hook

`useListControls<T>(config)` is the single source of truth for a list's control
state, and the **single writer** of the URL query string (prevents two
components racing on `router.replace`). It reads state from `useSearchParams`,
derives the visible slice, and writes changes back with
`router.replace(..., { scroll: false })`.

Config:

```ts
type SortOption<T> = {
  key: string;              // stable URL value, e.g. "recent"
  label: string;            // shown in the dropdown, e.g. "Recent"
  compare: (a: T, b: T) => number;
};

type ListControlsConfig<T> = {
  items: T[];
  basePath: string;                       // "/projects", for URL writes
  searchAccessor: (item: T) => string;    // concatenated searchable text
  sorts: SortOption<T>[];                 // sorts[0] is the default
  pageSize?: number;                      // default 10
  predicate?: (item: T) => boolean;       // extra filter (Projects category/tech)
};
```

Result:

```ts
type ListControlsResult<T> = {
  pageItems: T[];            // the current page's slice, post-filter+sort
  totalFiltered: number;     // count after search + predicate
  totalAll: number;          // items.length
  rangeStart: number;        // 1-based index of first item on page (0 if empty)
  rangeEnd: number;          // 1-based index of last item on page
  page: number;              // current page (1-based, clamped)
  pageCount: number;         // Math.max(1, ceil(totalFiltered / pageSize))
  query: string;
  setQuery: (value: string) => void;
  sortKey: string;
  setSortKey: (key: string) => void;
  getParam: (key: string) => string | null;   // read arbitrary extra param
  setParam: (key: string, value: string | null) => void; // write; null deletes
  goToPage: (page: number) => void;
  reset: () => void;         // clears q, sort→default, page→1, and extra params
};
```

Derivation order inside the hook: `items → search filter → predicate → sort →
paginate`. `page` is clamped to `[1, pageCount]` on every render so shrinking
the result set never strands the user on an empty page.

URL params owned by the hook: `q` (omitted when empty), `sort` (omitted when
default), `page` (omitted when 1). Extra params (Projects `category`,
`technology`) are read/written through `getParam`/`setParam` and merged into the
same single write.

### Projects integration (the one list with extra filters)

Projects keeps its `ProjectFilters` component (the category + technology
`<Select>`s) and its search box moves to the shared `SearchInput`. Projects
computes a `predicate` from the current `category`/`technology` values (read via
`getParam`) and passes it to the hook; when a select changes it calls
`setParam("category", ...)`. Because the hook is the only URL writer, the
category/technology params, `q`, `sort`, and `page` all live in one coherent
query string with no clobbering.

## Per-list configuration

| List | `searchAccessor` fields | Sort options (default first) | Extra filters |
|---|---|---|---|
| Projects | `title` + `description` | Recent (`createdAt` desc), Oldest (`createdAt` asc), Title A–Z, Title Z–A | category, technology |
| Experience | `title` + `companyName` | Newest start (`startDate` desc), Oldest start (`startDate` asc), Title A–Z | — |
| Education | `title` + `institutionName` | Newest start, Oldest start, Title A–Z | — |
| Courses | `title` + `institutionName` | Newest start, Oldest start, Title A–Z | — |
| Categories | `name` | Name A–Z, Name Z–A | — |
| Technologies | `name` | Name A–Z, Name Z–A | — |
| Custom sections | `name` + `description` | Manual order (`order` asc, nulls last), Name A–Z, Name Z–A | — |

Search is case-insensitive substring match (`toLocaleLowerCase().includes`),
matching Projects' current behavior. Date sorts compare the ISO strings
directly (lexicographic order equals chronological order for ISO dates).

## URL & state behavior

- All lists share `q`, `sort`, `page`. Projects also uses `category`,
  `technology`. Each param is omitted from the URL at its default value.
- `setQuery`, `setSortKey`, and `setParam` explicitly reset `page` to 1 (so a
  sort change, which does not shrink the result set, still returns to page 1).
  The page clamp is a secondary safety net for any other way the filtered set
  shrinks. `goToPage` is the only setter that changes the page without touching
  search/sort/filter.
- `router.replace(..., { scroll: false })` so the list does not jump.
- Existing Projects toast side-effect (`?created=1` / `?updated=1` cleanup) is
  preserved; those params are unrelated to the control params.

## Render integration

Each list view renders, in order:

1. Header (unchanged).
2. Summary block if the list already has one (Projects `ProjectSummary`);
   others have none — no summary is added.
3. Control bar: `SearchInput` + `SortSelect` (Projects also renders its
   category/technology selects via `ProjectFilters`).
4. The list body (existing table/mobile-list or cards) rendered from
   `pageItems` instead of the full array.
5. Footer: `Pagination` (hidden when `pageCount <= 1`) + a
   "Showing {rangeStart}–{rangeEnd} of {totalFiltered}" line.

Empty states (unchanged semantics):
- Zero items total → existing `EmptyState` ("No X yet" + create CTA).
- Items exist but search/filter matches none → "No matching" `EmptyState` with a
  Clear button that calls `reset()`.

## Custom sections nuance

Custom sections render each section with nested items and a dynamic field
schema — heterogeneous compared with the flat content lists. Scope here is the
**sections list only**: search by section name/description, paginate the
sections, and sort. The default sort is "Manual order" (the existing `order`
column, ascending, nulls last) so the page stays stable and consistent with how
sections render today. Nested items are untouched. This is the lowest-value of
the seven (users have few sections) but is included for uniform coverage per the
scope decision.

## Testing strategy

### Vitest (unit / integration)

- `use-list-controls` — the core logic:
  - search filters by accessor text, case-insensitive;
  - `predicate` composes with search;
  - each sort option orders correctly (including date and name directions);
  - pagination slices correctly; `rangeStart`/`rangeEnd`/`pageCount` math;
  - `page` clamps down when the filtered set shrinks;
  - URL round-trip: setters write the expected params (defaults omitted),
    initial state reads from params.
- `Pagination` — renders the right page buttons, disables Prev/Next at ends,
  hidden at `pageCount <= 1`, fires `goToPage`.
- `SortSelect` — lists options, reflects `sortKey`, fires `setSortKey`.
- `SearchInput` — controlled value, fires `setQuery`.

Use a router/searchParams test harness (mock `next/navigation`) consistent with
existing frontend tests.

### Playwright (e2e)

Extend one representative spec — **education** — to exercise the full control
bar end-to-end:

- Seed enough rows to cross the page boundary: `backend/prisma/e2e-seed.ts` adds
  ~12 education rows for the verified e2e user (labelled so the existing
  content-cleanup deletes them between runs).
- Assertions: search narrows the visible rows; a sort change reorders the first
  row; pagination shows page 2 and navigating there shows the remaining rows;
  the "Showing X–Y of N" line reflects state.

Other lists' existing specs stay as-is to limit e2e surface and flake. Their
control bars are covered by the shared unit tests plus the education e2e proving
the shared components work in a real page.

## File structure summary

**New:**
- `frontend/src/lib/list-controls/types.ts`
- `frontend/src/lib/list-controls/use-list-controls.ts`
- `frontend/src/components/ui/pagination.tsx`
- `frontend/src/components/ui/sort-select.tsx`
- `frontend/src/components/ui/search-input.tsx`

**Modified:**
- Seven list view components (projects, experience, education, courses,
  categories, technologies, custom sections) — wire the hook + control bar +
  pagination, render `pageItems`.
- `frontend/src/features/projects/components/project-filters.tsx` — search box
  extracted to the shared `SearchInput`; category/technology selects stay.
- `backend/prisma/e2e-seed.ts` — seed ~12 education rows for the e2e user.
- New unit test files alongside the new modules; `frontend/e2e/education.spec.ts`
  extended.
