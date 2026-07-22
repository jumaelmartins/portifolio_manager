# Soft-Delete / Archiving — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the backend soft-delete/archiving feature in the Next.js admin panel: a per-list state filter (Active | Archived | Trash) with per-state row actions (archive/unarchive/move-to-trash/restore/purge) across all six content surfaces, plus the BFF routes and query wiring behind them.

**Architecture:** `useListControls` gains a first-class `state` dimension (it stays the single query-string writer). Each list's page container reads `state` from the URL to drive a state-keyed TanStack query (`["resource", state]`); transitions are TanStack mutations that hit new BFF route handlers which forward to the backend and call `revalidatePortfolio()` (except purge). Two new shared UI primitives — `StateFilter` tabs and `ContentRowActions` — carry the repeated UI. Reorder ("Manual order") is offered only in the Active state.

**Tech Stack:** Next.js 16 (App Router, RSC + BFF Route Handlers), React 19, TanStack Query v5, @dnd-kit, Vitest + Testing Library, Playwright.

## Global Constraints

- Never implement on `master` — branch first (`feat/soft-delete-archiving-frontend`).
- Commit trailer EXACTLY (last line): `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Do not push to origin unless explicitly asked.
- **Next.js 16 has breaking changes** — before writing ANY Next.js code (route handlers, `params`, `searchParams`, `useSearchParams`, revalidation), consult `frontend/node_modules/next/dist/docs/` (per `frontend/AGENTS.md`). Route handler `params` is a `Promise` (`{ params: Promise<{ id: string }> }`) and must be awaited — follow the existing routes.
- All frontend commands run from `frontend/`. Dev server is port 3001.
- Unit tests: `npm run test:run` (Vitest, one-shot). Typecheck via the build or `npx tsc --noEmit`. E2E: `npm run test:e2e` (Playwright).
- The backend is already merged and running: default list GET is unchanged (active); `?state=active|archived|trash` filters; `DELETE /{resource}/:id` is soft (→ trash); `PATCH /{resource}/:id/{archive,unarchive,restore}` and `DELETE /{resource}/:id/purge` exist for projects/experience/education/courses; custom-sections mirror them on `:id` (sections) and `items/:itemId` (items), plus `GET /custom-sections/:sectionId/items?state=`.
- **Single URL writer:** `useListControls` is the ONLY writer of the dashboard query string. Containers may READ `state` from the URL (`useSearchParams`) to drive queries, but must never write it — writes go through `controls.setState`.
- Reorder is Active-only. `revalidatePortfolio()` runs on archive/unarchive/soft-delete/restore, NOT on purge.

## File Structure

**New shared files:**
- `frontend/src/lib/content-state.ts` — `ContentState` type + `parseContentState`.
- `frontend/src/components/ui/state-filter.tsx` — segmented Active/Archived/Trash tabs.
- `frontend/src/components/ui/content-row-actions.tsx` — per-state row action buttons.

**Modified shared files:**
- `frontend/src/lib/list-controls/types.ts` + `use-list-controls.ts` — add `state`/`setState`.

**Per content surface** (experience, education, courses, projects, custom-sections sections, custom-section items):
- New BFF route folders under `app/api/<resource>/[id]/{archive,unarchive,restore,purge}/route.ts` (+ items variant); modify the list `route.ts` GET to forward `?state`.
- `features/<resource>/api/*-api.ts` + `*-queries.ts` — state-aware fetch + transition mutations.
- `features/<resource>/components/*-view.tsx`, `*-table.tsx`, `*-mobile-list.tsx` (or grid/drawer) — state filter + `ContentRowActions`.
- `app/(dashboard)/<resource>/page.tsx` — container reads `state`, wires transition callbacks.

---

### Task 1: `ContentState` type + `useListControls` state dimension

**Files:**
- Create: `frontend/src/lib/content-state.ts`
- Test: `frontend/src/lib/content-state.test.ts`
- Modify: `frontend/src/lib/list-controls/types.ts`
- Modify: `frontend/src/lib/list-controls/use-list-controls.ts`
- Test: `frontend/src/lib/list-controls/use-list-controls.test.ts` (add)

**Interfaces:**
- Produces `ContentState = "active" | "archived" | "trash"`, `parseContentState(raw): ContentState` (defaults active).
- `useListControls` config gains optional `defaultState?: string`. When set, the hook reads/writes the `state` URL param and returns `state: string` + `setState(value: string)`. `setState` resets `page` to 1 AND `sortKey` to the default (sorts[0].key). When `defaultState` is omitted, `state` is `""` and never written (categories/technologies unaffected).

- [ ] **Step 1: Write the failing content-state test**

Create `frontend/src/lib/content-state.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseContentState } from "./content-state";

describe("parseContentState", () => {
  it("passes through the two non-default states", () => {
    expect(parseContentState("archived")).toBe("archived");
    expect(parseContentState("trash")).toBe("trash");
  });

  it("defaults to active for anything else", () => {
    expect(parseContentState("active")).toBe("active");
    expect(parseContentState(null)).toBe("active");
    expect(parseContentState(undefined)).toBe("active");
    expect(parseContentState("bogus")).toBe("active");
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:run -- content-state`
Expected: FAIL (module not found).

- [ ] **Step 3: Create the content-state module**

Create `frontend/src/lib/content-state.ts`:

```typescript
export type ContentState = "active" | "archived" | "trash";

export const CONTENT_STATES: ContentState[] = ["active", "archived", "trash"];

export function parseContentState(raw: string | null | undefined): ContentState {
  return raw === "archived" || raw === "trash" ? raw : "active";
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run test:run -- content-state`
Expected: PASS.

- [ ] **Step 5: Extend the list-controls types**

In `frontend/src/lib/list-controls/types.ts`, add `defaultState?: string;` to `ListControlsConfig<T>` (after `extraParamKeys`), and add to `ListControlsResult<T>`:

```typescript
  state: string;
  setState: (value: string) => void;
```

- [ ] **Step 6: Write the failing hook test**

In `frontend/src/lib/list-controls/use-list-controls.test.ts`, add a test that a hook created with `defaultState: "active"` starts at `"active"`, that `setState("archived")` updates `state` and writes `?state=archived` to the URL, that `setState` back to `"active"` removes the param, and that `setState` resets `page` to 1. Follow the file's existing test harness (it already renders the hook and inspects the mocked router). Concretely add:

```typescript
  it("manages a state dimension when defaultState is set", () => {
    const { result } = renderListControls({
      items: sampleItems,
      basePath: "/experience",
      searchAccessor: (i) => i.title,
      sorts: SORTS,
      defaultState: "active",
    });

    expect(result.current.state).toBe("active");

    act(() => result.current.goToPage(2));
    act(() => result.current.setState("archived"));

    expect(result.current.state).toBe("archived");
    expect(result.current.page).toBe(1);
    expect(lastReplace()).toBe("/experience?state=archived");

    act(() => result.current.setState("active"));
    expect(lastReplace()).toBe("/experience");
  });
```

(Adapt `renderListControls`, `sampleItems`, `SORTS`, `lastReplace` to the helpers/names already in this test file — read the file first and reuse its existing setup rather than inventing new names.)

- [ ] **Step 7: Run it, verify it fails**

Run: `npm run test:run -- use-list-controls`
Expected: FAIL (`state` undefined / not written).

- [ ] **Step 8: Implement the state dimension in the hook**

In `frontend/src/lib/list-controls/use-list-controls.ts`:

Add `state: string` to the `ControlState` type. Change `readState` to accept and apply the default state:

```typescript
function readState(
  searchParams: URLSearchParams,
  sortKeys: string[],
  defaultSortKey: string,
  extraParamKeys: string[],
  defaultState: string | undefined,
): ControlState {
  const rawSort = searchParams.get("sort");
  const rawPage = Number(searchParams.get("page"));
  const extras: Record<string, string> = {};
  for (const key of extraParamKeys) {
    const value = searchParams.get(key);
    if (value) extras[key] = value;
  }
  return {
    query: searchParams.get("q") ?? "",
    sortKey: rawSort && sortKeys.includes(rawSort) ? rawSort : defaultSortKey,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    extras,
    state:
      defaultState === undefined
        ? ""
        : searchParams.get("state") ?? defaultState,
  };
}
```

Destructure `defaultState` from `config`, pass it to `readState(... , defaultState)`, and in `writeUrl` add (after the extras loop):

```typescript
    if (defaultState !== undefined && next.state && next.state !== defaultState) {
      params.set("state", next.state);
    }
```

Add the setter (near `setSortKey`):

```typescript
  function setState(value: string) {
    update({ state: value, sortKey: defaultSortKey }, true);
  }
```

Return `state: state.state` and `setState` in the result object.

- [ ] **Step 9: Run the hook + full unit suite**

Run: `npm run test:run -- use-list-controls` then `npm run test:run -- content-state`
Expected: PASS. Then `npx tsc --noEmit` — clean.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/lib/content-state.ts frontend/src/lib/content-state.test.ts frontend/src/lib/list-controls
git commit -m "feat(frontend): add ContentState + state dimension to useListControls"
```

---

### Task 2: `StateFilter` tabs component

**Files:**
- Create: `frontend/src/components/ui/state-filter.tsx`
- Test: `frontend/src/components/ui/state-filter.test.tsx`

**Interfaces:**
- Produces `<StateFilter value={ContentState} onChange={(v: ContentState) => void} />` — a 3-tab segmented control (Active | Archived | Trash) with `role="tablist"`/`role="tab"` + `aria-selected`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/state-filter.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StateFilter } from "./state-filter";

describe("StateFilter", () => {
  it("renders three tabs and marks the active one selected", () => {
    render(<StateFilter value="archived" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Archived" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Trash" })).toHaveAttribute("aria-selected", "false");
  });

  it("emits the clicked state", () => {
    const onChange = vi.fn();
    render(<StateFilter value="active" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Trash" }));
    expect(onChange).toHaveBeenCalledWith("trash");
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:run -- state-filter`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `frontend/src/components/ui/state-filter.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { ContentState } from "@/lib/content-state";

const TABS: { value: ContentState; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "trash", label: "Trash" },
];

type StateFilterProps = {
  value: ContentState;
  onChange: (value: ContentState) => void;
};

export function StateFilter({ value, onChange }: StateFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Content state"
      className="inline-flex rounded-lg border border-border bg-card/60 p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run test:run -- state-filter`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/state-filter.tsx frontend/src/components/ui/state-filter.test.tsx
git commit -m "feat(frontend): add StateFilter tabs component"
```

---

### Task 3: `ContentRowActions` component

**Files:**
- Create: `frontend/src/components/ui/content-row-actions.tsx`
- Test: `frontend/src/components/ui/content-row-actions.test.tsx`

**Interfaces:**
- Produces `<ContentRowActions state editHref label onArchive onUnarchive onRestore onSoftDelete onPurge />`. Renders per state:
  - `active`: Edit (link) · Archive · Move to trash
  - `archived`: Edit (link) · Unarchive · Move to trash
  - `trash`: Restore · Delete permanently

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/content-row-actions.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentRowActions } from "./content-row-actions";

const noop = () => {};

function renderActions(state: "active" | "archived" | "trash", overrides = {}) {
  const handlers = {
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
    onRestore: vi.fn(),
    onSoftDelete: vi.fn(),
    onPurge: vi.fn(),
  };
  render(
    <ContentRowActions
      state={state}
      label="Widget"
      editHref="/widgets/1/edit"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe("ContentRowActions", () => {
  it("active: edit, archive, move-to-trash", () => {
    const h = renderActions("active");
    expect(screen.getByRole("link", { name: "Edit Widget" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive Widget" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Widget to trash" }));
    expect(h.onArchive).toHaveBeenCalled();
    expect(h.onSoftDelete).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Restore Widget" })).toBeNull();
  });

  it("archived: edit, unarchive, move-to-trash", () => {
    const h = renderActions("archived");
    fireEvent.click(screen.getByRole("button", { name: "Unarchive Widget" }));
    expect(h.onUnarchive).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Edit Widget" })).toBeInTheDocument();
  });

  it("trash: restore + delete permanently, no edit", () => {
    const h = renderActions("trash");
    expect(screen.queryByRole("link", { name: "Edit Widget" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Restore Widget" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Widget permanently" }));
    expect(h.onRestore).toHaveBeenCalled();
    expect(h.onPurge).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test:run -- content-row-actions`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `frontend/src/components/ui/content-row-actions.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentState } from "@/lib/content-state";

type ContentRowActionsProps = {
  state: ContentState;
  label: string;
  editHref: string;
  onArchive: () => void;
  onUnarchive: () => void;
  onRestore: () => void;
  onSoftDelete: () => void;
  onPurge: () => void;
};

export function ContentRowActions({
  state,
  label,
  editHref,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ContentRowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {state !== "trash" && (
        <Link
          href={editHref}
          aria-label={`Edit ${label}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Pencil />
        </Link>
      )}

      {state === "active" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Archive ${label}`}
          onClick={onArchive}
        >
          <Archive />
        </Button>
      )}

      {state === "archived" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Unarchive ${label}`}
          onClick={onUnarchive}
        >
          <ArchiveRestore />
        </Button>
      )}

      {state === "trash" ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Restore ${label}`}
            onClick={onRestore}
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${label} permanently`}
            className="text-muted-foreground hover:text-destructive"
            onClick={onPurge}
          >
            <Trash2 />
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${label} to trash`}
          className="text-muted-foreground hover:text-destructive"
          onClick={onSoftDelete}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run test:run -- content-row-actions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/content-row-actions.tsx frontend/src/components/ui/content-row-actions.test.tsx
git commit -m "feat(frontend): add ContentRowActions per-state row buttons"
```

---

### Task 4: Experience — BFF transition routes + state-forwarding GET

**Files:**
- Create: `frontend/src/app/api/experience/[id]/archive/route.ts`
- Create: `frontend/src/app/api/experience/[id]/unarchive/route.ts`
- Create: `frontend/src/app/api/experience/[id]/restore/route.ts`
- Create: `frontend/src/app/api/experience/[id]/purge/route.ts`
- Modify: `frontend/src/app/api/experience/route.ts` (GET forwards `?state`)

**Interfaces:**
- Produces BFF endpoints `PATCH /api/experience/:id/{archive,unarchive,restore}` (revalidate) and `DELETE /api/experience/:id/purge` (no revalidate), each returning `{ id }`. `GET /api/experience?state=` forwards the state.

- [ ] **Step 1: Add state forwarding to the list GET**

In `frontend/src/app/api/experience/route.ts`, change `GET` to read `?state` and forward it:

```typescript
export async function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state");
  const suffix = state && state !== "active" ? `?state=${state}` : "";
  const response = await backendFetch(`/experience${suffix}`);
  if (!response.ok) return toBffResponse(response);
  const items = (await response.json()) as BackendExperience[];
  return NextResponse.json(items.map(normalizeExperience));
}
```

- [ ] **Step 2: Create the archive route**

Create `frontend/src/app/api/experience/[id]/archive/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid experience ID" },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/experience/${id}/archive`, {
    method: "PATCH",
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json({ id });
}
```

- [ ] **Step 3: Create the unarchive and restore routes**

Create `.../[id]/unarchive/route.ts` and `.../[id]/restore/route.ts` — identical to Step 2 but with the backend path `/experience/${id}/unarchive` and `/experience/${id}/restore` respectively.

- [ ] **Step 4: Create the purge route (no revalidate)**

Create `frontend/src/app/api/experience/[id]/purge/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid experience ID" },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/experience/${id}/purge`, {
    method: "DELETE",
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
```

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (from `frontend/`) — clean. (These are self-contained forwarders following the existing route pattern; no unit tests, consistent with the reorder BFF routes.)

```bash
git add frontend/src/app/api/experience
git commit -m "feat(frontend): experience soft-delete BFF routes + state-forwarding GET"
```

---

### Task 5: Experience — state-aware queries + transition mutations

**Files:**
- Modify: `frontend/src/features/experience/api/experience-api.ts`
- Modify: `frontend/src/features/experience/api/experience-queries.ts`
- Test: `frontend/src/features/experience/api/experience-queries.test.tsx` (create — or extend if present)

**Interfaces:**
- Produces `getExperiences(state)`, `archiveExperience/unarchiveExperience/restoreExperience/purgeExperience(id)` in the api module.
- Produces `useExperiences(state)` (query key `["experience", state]`), and `useArchiveExperience/useUnarchiveExperience/useRestoreExperience/usePurgeExperience` mutation hooks that invalidate `experienceKeys.all` (prefix — covers every state) + `["dashboard"]`. `useReorderExperiences` now targets `["experience", "active"]`. `useDeleteExperience` is unchanged (the backend made `DELETE :id` soft).

- [ ] **Step 1: Extend the api module**

In `experience-api.ts`, import the type and change `getExperiences`, add the four transitions:

```typescript
import type { ContentState } from "@/lib/content-state";
```

```typescript
export function getExperiences(state: ContentState = "active") {
  const suffix = state === "active" ? "" : `?state=${state}`;
  return requestJson<ExperienceEntry[]>(`/api/experience${suffix}`);
}

export function archiveExperience(id: number) {
  return requestJson<{ id: number }>(`/api/experience/${id}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveExperience(id: number) {
  return requestJson<{ id: number }>(`/api/experience/${id}/unarchive`, {
    method: "PATCH",
  });
}

export function restoreExperience(id: number) {
  return requestJson<{ id: number }>(`/api/experience/${id}/restore`, {
    method: "PATCH",
  });
}

export function purgeExperience(id: number) {
  return requestJson<{ id: number }>(`/api/experience/${id}/purge`, {
    method: "DELETE",
  });
}
```

- [ ] **Step 2: Write the failing queries test**

Create `frontend/src/features/experience/api/experience-queries.test.tsx` asserting (a) `useExperiences("archived")` fetches `/api/experience?state=archived`, and (b) `useArchiveExperience().mutate(id)` calls `PATCH /api/experience/:id/archive` and invalidates `["experience"]`. Use a `QueryClientProvider` + a mocked `fetch` (follow the patterns already used in the repo's query tests — search for an existing `*-queries.test` or `renderHook` + `QueryClientProvider` setup and mirror it). Minimal shape:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useArchiveExperience,
  useExperiences,
} from "./experience-queries";

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
});
afterEach(() => vi.unstubAllGlobals());

describe("experience queries", () => {
  it("fetches archived state", async () => {
    renderHook(() => useExperiences("archived"), { wrapper: wrapper() });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/experience?state=archived",
        expect.anything(),
      ),
    );
  });

  it("archive hits the archive route", async () => {
    const { result } = renderHook(() => useArchiveExperience(), { wrapper: wrapper() });
    result.current.mutate(7);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/experience/7/archive",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npm run test:run -- experience-queries`
Expected: FAIL (hooks/signatures missing).

- [ ] **Step 4: Extend the queries module**

In `experience-queries.ts`, import the new api functions + `ContentState`, change `useExperiences` and `useReorderExperiences`, add a shared invalidation helper and the four mutation hooks:

```typescript
import type { ContentState } from "@/lib/content-state";
```

```typescript
export function useExperiences(state: ContentState = "active") {
  return useQuery({
    queryKey: [...experienceKeys.all, state],
    queryFn: () => getExperiences(state),
  });
}
```

```typescript
function useExperienceTransition(mutationFn: (id: number) => Promise<{ id: number }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useArchiveExperience() {
  return useExperienceTransition(archiveExperience);
}
export function useUnarchiveExperience() {
  return useExperienceTransition(unarchiveExperience);
}
export function useRestoreExperience() {
  return useExperienceTransition(restoreExperience);
}
export function usePurgeExperience() {
  return useExperienceTransition(purgeExperience);
}
```

Change the reorder hook's key to the active bucket:

```typescript
export function useReorderExperiences() {
  return useReorder<ExperienceEntry[]>({
    queryKey: [...experienceKeys.all, "active"],
    mutationFn: reorderExperiences,
    applyOptimistic: (items, ids) => reorderByIds(items, ids),
  });
}
```

(`experienceKeys.all` stays `["experience"]`; invalidating it prefix-matches every `["experience", state]`. Import `archiveExperience`, `unarchiveExperience`, `restoreExperience`, `purgeExperience` from `./experience-api`.)

- [ ] **Step 5: Run it, verify it passes**

Run: `npm run test:run -- experience-queries`
Expected: PASS. Then `npx tsc --noEmit` — clean.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/experience/api
git commit -m "feat(frontend): experience state-aware queries + transition mutations"
```

---

### Task 6: Experience — view, table, mobile list, page container

**Files:**
- Modify: `frontend/src/features/experience/components/experience-view.tsx`
- Modify: `frontend/src/features/experience/components/experience-table.tsx`
- Modify: `frontend/src/features/experience/components/experience-mobile-list.tsx`
- Modify: `frontend/src/app/(dashboard)/experience/page.tsx`
- Modify/Test: `frontend/src/features/experience/components/experience-view.test.tsx`

**Interfaces:**
- Consumes Task 1 (`useListControls` `state`/`setState`, `ContentState`, `parseContentState`), Task 2 (`StateFilter`), Task 3 (`ContentRowActions`), Task 5 (transition hooks).
- Produces: the experience list renders a `StateFilter`; the Table/MobileList render `ContentRowActions` given the current `state` + per-entry transition callbacks; "Manual order" is offered only in Active; the purge confirm dialog appears only in Trash; soft-delete/archive/unarchive/restore are direct (toast feedback).

- [ ] **Step 1: Rework the container to read state + wire transitions**

Rewrite `ExperiencePageContent` in `app/(dashboard)/experience/page.tsx`:

```tsx
function ExperiencePageContent() {
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const experiences = useExperiences(state);
  const softDelete = useDeleteExperience();
  const archive = useArchiveExperience();
  const unarchive = useUnarchiveExperience();
  const restore = useRestoreExperience();
  const purge = usePurgeExperience();

  return (
    <ExperienceView
      entries={experiences.data ?? []}
      state={state}
      isPending={experiences.isPending}
      error={experiences.error}
      onRetry={() => void experiences.refetch()}
      onArchive={(entry) => archive.mutate(entry.id)}
      onUnarchive={(entry) => unarchive.mutate(entry.id)}
      onRestore={(entry) => restore.mutate(entry.id)}
      onSoftDelete={(entry) => softDelete.mutate(entry.id)}
      onPurge={async (entry) => {
        await purge.mutateAsync(entry.id);
      }}
    />
  );
}
```

Add the imports for `useSearchParams` (from `next/navigation`), `parseContentState` (`@/lib/content-state`), and the new hooks from `experience-queries`.

- [ ] **Step 2: Update the view test to the new props/behaviour**

In `experience-view.test.tsx`, update the render helper to pass `state="active"` and the five callbacks (`onArchive`/`onUnarchive`/`onRestore`/`onSoftDelete`/`onPurge`) instead of `onDelete`. Add assertions: (a) a `StateFilter` (`role="tablist"`) renders; (b) in `state="active"` a row shows an "Archive" button that calls `onArchive`; (c) in `state="trash"` a row shows "Restore" and "Delete … permanently" and NO "Manual order" option. Read the current test file and preserve its existing passing assertions where still valid; mirror the reorder-era `renderView`+`QueryClientProvider` harness already in the file.

- [ ] **Step 3: Run it, verify it fails**

Run: `npm run test:run -- experience-view`
Expected: FAIL (props/StateFilter missing).

- [ ] **Step 4: Rework the view**

In `experience-view.tsx`:
- Change `ExperienceViewProps`: replace `onDelete` with `state: ContentState` and the five callbacks `onArchive/onUnarchive/onRestore/onSoftDelete/onPurge`, each `(entry: ExperienceEntry) => void` (purge may be `=> void`; the dialog awaits it).
- Import `StateFilter`, `ContentState`, and keep `useListControls` with `defaultState: "active"`.
- Compute `const sortOptions = state === "active" ? EXPERIENCE_SORTS : EXPERIENCE_SORTS.filter((s) => s.key !== "order");` and pass `sortOptions` to `SortSelect` (keep passing the full `EXPERIENCE_SORTS` to `useListControls` so all compares exist).
- `const isManual = state === "active" && controls.sortKey === "order";`
- Render `<StateFilter value={state} onChange={(next) => controls.setState(next)} />` above the search/sort row.
- Replace `entryToDelete` with `entryToPurge` (only used in Trash); the `DeleteExperienceDialog` becomes the PURGE confirm (its existing copy "permanently removes …" already fits) with `onConfirm={onPurge}`, shown only when `entryToPurge !== null`.
- Pass `state` + the transition callbacks to `ExperienceTable` and `ExperienceMobileList` (soft-delete direct; purge opens `setEntryToPurge`).
- In the manual (`isManual`) branch, keep the existing SortableList (Active only). Since `isManual` is false outside Active, Archived/Trash always render the paginated table/mobile list with `ContentRowActions`.

Wire the table props, e.g.:

```tsx
<ExperienceTable
  entries={controls.pageItems}
  state={state}
  onArchive={onArchive}
  onUnarchive={onUnarchive}
  onRestore={onRestore}
  onSoftDelete={onSoftDelete}
  onPurge={(entry) => setEntryToPurge(entry)}
/>
```

- [ ] **Step 5: Rework the table + mobile list to use ContentRowActions**

In `experience-table.tsx` and `experience-mobile-list.tsx`, change the props to:

```typescript
type ExperienceTableProps = {
  entries: ExperienceEntry[];
  state: ContentState;
  onArchive: (entry: ExperienceEntry) => void;
  onUnarchive: (entry: ExperienceEntry) => void;
  onRestore: (entry: ExperienceEntry) => void;
  onSoftDelete: (entry: ExperienceEntry) => void;
  onPurge: (entry: ExperienceEntry) => void;
};
```

Replace the inline Edit/Delete buttons in the Actions cell with:

```tsx
<ContentRowActions
  state={state}
  label={entry.title}
  editHref={`/experience/${entry.id}/edit`}
  onArchive={() => onArchive(entry)}
  onUnarchive={() => onUnarchive(entry)}
  onRestore={() => onRestore(entry)}
  onSoftDelete={() => onSoftDelete(entry)}
  onPurge={() => onPurge(entry)}
/>
```

Import `ContentRowActions` and `ContentState`.

- [ ] **Step 6: Run the view test + full suite**

Run: `npm run test:run -- experience` then `npm run test:run` (full).
Expected: PASS. Then `npx tsc --noEmit` — clean.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/experience frontend/src/app/\(dashboard\)/experience
git commit -m "feat(frontend): experience state filter + per-state row actions"
```

---

### Task 7: Education and Courses — apply the experience pattern

Education and Courses are structurally identical to Experience (same api/queries/view/table/mobile-list shape, same page container). Apply Tasks 4, 5, and 6 to each, using this substitution:

| | experience | education | courses |
|---|---|---|---|
| BFF folder | `app/api/experience` | `app/api/education` | `app/api/courses` |
| feature dir | `features/experience` | `features/education` | `features/courses` |
| page | `app/(dashboard)/experience/page.tsx` | `.../education/page.tsx` | `.../courses/page.tsx` |
| entry type | `ExperienceEntry` | (its education entry type) | (its course entry type) |
| edit href | `/experience/${id}/edit` | `/education/${id}/edit` | `/courses/${id}/edit` |
| `ContentRowActions` label | `entry.title` | the education title field | the course title field |

**Files (per module):** the four BFF route files + list `route.ts` GET; `*-api.ts`; `*-queries.ts` (+ its queries test); `*-view.tsx`, `*-table.tsx`, `*-mobile-list.tsx`; `app/(dashboard)/<m>/page.tsx`; `*-view.test.tsx`.

**Interfaces:** identical to Tasks 4–6 with the names substituted. Reorder hook key → `[...<m>Keys.all, "active"]`. Transition mutations invalidate `<m>Keys.all` + `["dashboard"]`.

- [ ] **Step 1: Education — BFF routes + state GET** (mirror Task 4 for `education`). Run `npx tsc --noEmit`; commit `feat(frontend): education soft-delete BFF routes`.
- [ ] **Step 2: Education — queries + mutations** (mirror Task 5; read `features/education/api/*` first to match its exact names). Run `npm run test:run -- education-queries`; commit.
- [ ] **Step 3: Education — view/table/mobile/page** (mirror Task 6; read the current education view/table/mobile-list/page first). Run `npm run test:run -- education`; commit `feat(frontend): education state filter + per-state row actions`.
- [ ] **Step 4: Courses — BFF routes + state GET** (mirror Task 4 for `courses`). Commit.
- [ ] **Step 5: Courses — queries + mutations** (mirror Task 5). Run `npm run test:run -- courses-queries`; commit.
- [ ] **Step 6: Courses — view/table/mobile/page** (mirror Task 6). Run `npm run test:run -- courses`; commit `feat(frontend): courses state filter + per-state row actions`.
- [ ] **Step 7: Verify** — `npm run test:run` (full) + `npx tsc --noEmit` clean.

---

### Task 8: Projects — apply the pattern with filters hidden outside Active

Projects follows the Experience pattern with two additions: it fetches `categories`/`technologies` and renders `ProjectSummary` + `ProjectFilters`. The container passes those through; the plan only adds the state dimension.

**Files:** `app/api/projects/[id]/{archive,unarchive,restore,purge}/route.ts` + `app/api/projects/route.ts` GET; `features/projects/api/project-api.ts` + `project-queries.ts` (+ test); `features/projects/components/projects-view.tsx`, `project-table.tsx`, `project-mobile-list.tsx`; `app/(dashboard)/projects/page.tsx`; `projects-view.test.tsx`.

**Interfaces:** as Tasks 4–6, for `projects`. Reorder key → `["projects", "active"]` (confirm the exact `projectKeys.all` value in `project-queries.ts` and append `"active"`). `getProjects(state)` DIRECT-fetches `/api/projects?state=` and (per the existing convention) does NOT re-normalize — the BFF GET route already normalizes; match the current `getProjects` exactly, only adding the `state` suffix.

- [ ] **Step 1: BFF routes + state GET** (mirror Task 4 for `projects`; the projects `[id]/route.ts` DELETE is already soft after the backend merge — leave it). Note: projects' transition backend responses are presented objects, but the BFF transition routes return `{ id }` (no normalizer needed), same as Task 4. Commit.
- [ ] **Step 2: Queries + mutations** (mirror Task 5; read `project-queries.ts` first — keep `getProjects` direct-fetch, add `state`; reorder key `["projects","active"]`). Run `npm run test:run -- project-queries`; commit.
- [ ] **Step 3: View/table/mobile/page** (mirror Task 6). Additional projects-specific rule: `ProjectSummary` and `ProjectFilters` render only in Active + non-manual — extend the existing `{!isManual && ...}` guards to `{state === "active" && !isManual && ...}` so Archived/Trash show neither the category/technology filters nor the summary (the filters operate on the active set's option lists; hide them off-Active). Keep search + pagination available in Archived/Trash. The container reads `state` and passes it down alongside the existing `categories`/`technologies`. Run `npm run test:run -- projects`; commit `feat(frontend): projects state filter + per-state row actions`.
- [ ] **Step 4: Verify** — `npm run test:run` + `npx tsc --noEmit` clean.

---

### Task 9: Custom-sections — BFF routes (sections + items) + state GET

**Files:**
- Create: `app/api/custom-sections/[id]/{archive,unarchive,restore,purge}/route.ts` (sections)
- Create: `app/api/custom-sections/items/[itemId]/{archive,unarchive,restore,purge}/route.ts` (items)
- Modify: `app/api/custom-sections/route.ts` (GET forwards `?state`)
- Create: `app/api/custom-sections/[id]/items/route.ts` **GET** with `?state` → forwards `GET /custom-sections/:id/items?state=` (the drawer's items feed). If a `route.ts` already exists at that path for another method, add the `GET` export to it.

**Interfaces:**
- Section transitions: `PATCH /api/custom-sections/:id/{archive,unarchive,restore}` (revalidate) + `DELETE /api/custom-sections/:id/purge` (no revalidate), returning `{ id }`.
- Item transitions: same under `/api/custom-sections/items/:itemId/...`.
- `GET /api/custom-sections?state=` (sections by state) and `GET /api/custom-sections/:id/items?state=` (items by state) forward the state; both normalize as the existing custom-sections GET routes do (read those routes first to match the RAW-vs-normalize convention — the sections list GET currently returns RAW for the client to normalize; the items GET should return what the drawer expects — match the existing item shape used by the reorder route).

- [ ] **Step 1: Section transition routes** — mirror Task 4's archive/unarchive/restore/purge, backend paths `/custom-sections/${id}/{archive,unarchive,restore}` (PATCH) and `/custom-sections/${id}/purge` (DELETE). Return `{ id }`. Revalidate on all but purge.
- [ ] **Step 2: Item transition routes** — same under `items/[itemId]`, backend paths `/custom-sections/items/${itemId}/...`.
- [ ] **Step 3: State-forwarding GETs** — sections list GET forwards `?state`; add the `:id/items` GET forwarding `?state`, matching the normalize convention of the existing custom-sections routes (read `app/api/custom-sections/route.ts` and `app/api/custom-sections/[id]/items/route.ts` / the reorder route first).
- [ ] **Step 4: Verify + commit** — `npx tsc --noEmit` clean; commit `feat(frontend): custom-sections soft-delete BFF routes (sections + items)`.

---

### Task 10: Custom-sections — sections grid state filter + per-state actions

**Files:** `features/custom-sections/api/*` (state-aware sections fetch + section transition mutations), `features/custom-sections/components/sections-view.tsx` (+ its card), `app/(dashboard)/custom-sections/page.tsx`, `sections-view.test.tsx`.

**Interfaces:** `useSections(state)` keyed `[...sectionKeys.all, state]`; `useArchiveSection/useUnarchiveSection/useRestoreSection/usePurgeSection`; the existing section soft-delete via `DELETE :id` (now soft). Reorder key → `[...sectionKeys.all, "active"]`. Manual order (reorder) is the default sort in Active only; in Archived/Trash, offer a non-manual default and hide reorder.

- [ ] **Step 1: Read the current custom-sections feature** — `sections-view.tsx`, its card component, `custom-sections` api/queries, and `app/(dashboard)/custom-sections/page.tsx`. Note the RAW-vs-normalize convention (from the reorder work: `reorderSections` direct-fetches; the GET returns RAW and the client normalizes). Preserve it: `getSections(state)` must keep the current normalize behaviour, only appending `?state`.
- [ ] **Step 2: State-aware queries + transitions** — add `state` to the sections fetch/key, add the four section transition mutations (invalidate `sectionKeys.all` prefix + `["dashboard"]`), point reorder at `[...sectionKeys.all, "active"]`. Write a focused queries test (archived fetch + one transition route). Run `npm run test:run -- <sections-queries>`; commit.
- [ ] **Step 3: Grid view + card** — add `<StateFilter>` above the grid; read `state` in the container from the URL; render `<ContentRowActions>` on each section card (edit href = the section edit route; label = section name); soft-delete direct, purge via the existing section delete/confirm dialog reworded for permanence and shown only in Trash; reorder (SortableList) only in Active. Update `sections-view.test.tsx`. Run `npm run test:run -- sections`; commit `feat(frontend): custom-sections grid state filter + per-state actions`.
- [ ] **Step 4: Verify** — `npm run test:run` + `npx tsc --noEmit` clean.

---

### Task 11: Custom-section items — drawer state filter + per-state actions

**Files:** `features/custom-sections/api/*` (item transition mutations + a state-aware items fetch for the drawer), `features/custom-sections/components/items-drawer.tsx`, `items-drawer.test.tsx`.

**Interfaces:** the drawer gains a `StateFilter` and fetches items for the chosen state via `GET /api/custom-sections/:id/items?state=` (Task 9 Step 3) keyed by `(sectionId, state)`; `useArchiveItem/useUnarchiveItem/useRestoreItem/usePurgeItem`; the existing item soft-delete via `DELETE items/:itemId` (now soft). Reorder of items stays Active-only.

- [ ] **Step 1: Read the current drawer** — `items-drawer.tsx` + its test + the current items reorder wiring (`useReorderItems`, `reorderItems` returning `Promise<void>`). Note items currently come embedded in the section object; this task switches the drawer's item source to the new state-aware `GET :id/items?state=` endpoint so it can show archived/trashed items.
- [ ] **Step 2: Items API + query + transition mutations** — add `getSectionItems(sectionId, state)` hitting `/api/custom-sections/${sectionId}/items?state=`, a `useSectionItems(sectionId, state)` query keyed `["custom-section-items", sectionId, state]`, and `useArchiveItem/useUnarchiveItem/useRestoreItem/usePurgeItem` (invalidate the items query for that section + the sections list + `["dashboard"]`). Reorder items key → `["custom-section-items", sectionId, "active"]`. Focused queries test; commit.
- [ ] **Step 3: Drawer view** — add `<StateFilter>` inside the drawer (its own local state or a drawer-scoped URL param — keep it local to avoid competing with `useListControls`' URL writer; the drawer isn't a `useListControls` surface). Render `<ContentRowActions>` per item (edit = the item edit affordance; label = a stable item label); soft-delete direct, purge via a confirm dialog shown only in Trash; reorder (SortableList) only in Active. Update `items-drawer.test.tsx`. Run `npm run test:run -- items-drawer`; commit `feat(frontend): custom-section items drawer state filter + per-state actions`.
- [ ] **Step 4: Verify** — `npm run test:run` + `npx tsc --noEmit` clean.

---

### Task 12: Playwright e2e — archive/trash/restore lifecycle

**Files:** Create `frontend/e2e/soft-delete.spec.ts`.

**Interfaces:** an e2e that logs in (reuse the existing `frontend/e2e` login/reset helpers — read `reorder.spec.ts` / `experience.spec.ts` for the helper names), then on the experience list: archives an entry → asserts it leaves the Active tab, appears under the Archived tab, and (optionally) is absent from the public site; moves it to Trash → asserts it appears under Trash; restores it → asserts it returns to Active.

- [ ] **Step 1: Write the spec** following the structure of `frontend/e2e/reorder.spec.ts` (same login/reset/beforeEach). Use accessible selectors: `getByRole("tab", { name: "Archived" })`, the row's `getByRole("button", { name: /Archive / })`, etc.
- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` clean. **Do NOT run the e2e** (deferred — port 3000/e2e env, consistent with the project's deferred e2e). Note the prerequisite: the e2e seed needs ≥1 experience row for the authenticated user.
- [ ] **Step 3: Commit** — `test(frontend): e2e soft-delete archive/trash/restore lifecycle`.

---

## Self-Review

**Spec coverage (spec Parte 2 / Seções 5–10):**
- `useListControls` gains `state` dimension, single writer, resets page (+sort) → Task 1. ✓
- Per-list state filter UI "Active | Archived | Trash" → Task 2 (`StateFilter`) applied in Tasks 6–11. ✓
- Per-state row actions (Active/Archived/Trash) → Task 3 (`ContentRowActions`) applied in Tasks 6–11. ✓
- Reorder only in Active → Tasks 6/8/10/11 gate `isManual` on `state === "active"` and hide the Manual-order option elsewhere. ✓
- BFF routes archive/unarchive/restore/purge + `revalidatePortfolio()` on all but purge; GET forwards `?state` → Tasks 4/7/8/9. ✓
- Custom-section items drawer parity → Task 11. ✓
- All six surfaces covered → Tasks 6 (experience), 7 (education, courses), 8 (projects), 10 (sections), 11 (items). ✓
- Edge cases: restore-title-collision 409 surfaces as a toast (the transition mutation's error → the api layer throws `ApiError`; a follow-up may add an explicit toast on restore error — noted, minor); reorder exact-set integrity preserved because Active fetch is `["resource","active"]` and reorder targets it. ✓
- Testing: unit (hook, StateFilter, ContentRowActions, queries, views) + Playwright e2e → Tasks 1–3, 5–11, 12. ✓

**Placeholder scan:** No TBD/TODO. Tasks 7/8/10/11 use explicit substitution/delta instructions (not vague "similar to") and direct the implementer to read the concrete current file first, because those surfaces (education/courses names, projects filters, custom-sections grid/drawer) diverge in ways best matched against the live file — the shared primitives (Tasks 1–3) carry the invariant logic.

**Type/name consistency:** `ContentState`, `StateFilter`, `ContentRowActions` signatures are fixed in Tasks 1–3 and consumed unchanged in Tasks 6–11. Query keys: `[...keys.all, state]` for lists, `[...keys.all, "active"]` for reorder, invalidation via `keys.all` (prefix) — consistent across modules. Transition mutations return `{ id }` and BFF routes return `{ id }` — consistent.

## Global constraints (carry into the plan)

- Branch first; never on `master`. Commit trailer exact. Do not push.
- Next.js 16: consult `frontend/node_modules/next/dist/docs/` before Next.js code; route `params` is a `Promise`.
- `useListControls` stays the single dashboard URL writer; containers only READ `state`.
- Reorder is Active-only; `revalidatePortfolio()` on archive/unarchive/soft-delete/restore, never on purge.
- Preserve each slice's existing normalize convention (projects/experience/education/courses BFF GET normalizes server-side → client direct-fetches; custom-sections GET returns RAW → client normalizes; reorder routes normalize server-side).

## Execution Handoff

This is the frontend half of the soft-delete feature; the backend is already merged to `master`. Execute via subagent-driven-development on a fresh `feat/soft-delete-archiving-frontend` branch.
