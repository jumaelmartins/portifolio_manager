# List Pagination + Advanced Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every dashboard list (7 total) a consistent client-side control bar — text search, sort dropdown, numbered pagination (10/page, URL-backed) — reusing one shared engine and three UI primitives.

**Architecture:** A generic `useListControls<T>` hook is the single source of truth for a list's search/sort/page state and the **single writer** of the URL query string. Three presentational primitives (`Pagination`, `SortSelect`, `SearchInput`) render the controls. Each list view calls the hook, renders the control bar, and paginates its existing table/card body from `controls.pageItems`. No backend, BFF, or database schema changes; all processing happens in the browser on the already-fetched array.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, TanStack Query (data already provided via props/queries — untouched), base-ui (`@base-ui/react/select`), `class-variance-authority` (`buttonVariants`), lucide-react, Tailwind, Vitest + Testing Library (unit), Playwright (e2e), Prisma (e2e seed only).

## Global Constraints

- **Next.js 16** — breaking changes from training data. Before writing any Next.js code, read the relevant guide under `frontend/node_modules/next/dist/docs/` (per `frontend/AGENTS.md`).
- **Single URL writer:** only `useListControls` calls `router.replace` for control params (`q`, `sort`, `page`, and extras). Views must not write those params elsewhere. The pre-existing `?created=1` / `?updated=1` toast-cleanup effect stays as-is (unrelated params).
- **URL param omission:** each control param is omitted from the URL at its default value — `q` when empty, `sort` when equal to the default sort key, `page` when `1`, an extra param when unset.
- `router.replace(..., { scroll: false })` on every write.
- **Page size = 10** everywhere (`DEFAULT_PAGE_SIZE`).
- **"Showing" line copy:** exactly `Showing {rangeStart}–{rangeEnd} of {totalFiltered}` using an EN DASH (`–`, U+2013), not a hyphen. Tests assert this exact glyph.
- **No backend/BFF/DB changes** except `backend/prisma/e2e-seed.ts` (e2e fixture rows only). List endpoints keep returning bare arrays.
- Search is case-insensitive substring match via `toLocaleLowerCase().includes(...)`. Date sorts compare ISO strings lexicographically (equals chronological).
- Unit tests colocated as `*.test.ts` / `*.test.tsx`; run with `npm run test:run` from `frontend/`.
- Every commit message ends with the trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Branch: `feat/list-pagination-filters` (already checked out; design committed as `a29c18c`). Do not work on `master`.

---

### Task 1: `useListControls` engine hook + types

**Files:**
- Create: `frontend/src/lib/list-controls/types.ts`
- Create: `frontend/src/lib/list-controls/use-list-controls.ts`
- Test: `frontend/src/lib/list-controls/use-list-controls.test.ts`

**Interfaces:**
- Produces `SortOption<T>`, `ListControlsConfig<T>`, `ListControlsResult<T>` (types.ts).
- Produces `useListControls<T>(config): ListControlsResult<T>` and `DEFAULT_PAGE_SIZE` (use-list-controls.ts).
- Consumed by Tasks 3, 5–11.

- [ ] **Step 1: Write the types file** (no test of its own — it is exercised by the hook test)

Create `frontend/src/lib/list-controls/types.ts`:

```ts
export type SortOption<T> = {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
};

export type ListControlsConfig<T> = {
  items: T[];
  basePath: string;
  searchAccessor: (item: T) => string;
  sorts: SortOption<T>[];
  pageSize?: number;
  predicate?: (
    item: T,
    params: { getParam: (key: string) => string | null },
  ) => boolean;
  extraParamKeys?: string[];
};

export type ListControlsResult<T> = {
  pageItems: T[];
  totalFiltered: number;
  totalAll: number;
  rangeStart: number;
  rangeEnd: number;
  page: number;
  pageCount: number;
  query: string;
  setQuery: (value: string) => void;
  sortKey: string;
  setSortKey: (key: string) => void;
  getParam: (key: string) => string | null;
  setParam: (key: string, value: string | null) => void;
  goToPage: (page: number) => void;
  reset: () => void;
};
```

- [ ] **Step 2: Write the failing hook test**

Create `frontend/src/lib/list-controls/use-list-controls.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));

import type { SortOption } from "./types";
import { useListControls } from "./use-list-controls";

type Row = { id: number; title: string; created: string };

const rows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  title: `Item ${String(index + 1).padStart(2, "0")}`,
  created: `2026-01-${String(index + 1).padStart(2, "0")}`,
}));

const SORTS: SortOption<Row>[] = [
  { key: "recent", label: "Recent", compare: (a, b) => b.created.localeCompare(a.created) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

function setup(search = "") {
  useSearchParams.mockReturnValue(new URLSearchParams(search));
  return renderHook(() =>
    useListControls<Row>({
      items: rows,
      basePath: "/things",
      searchAccessor: (row) => row.title,
      sorts: SORTS,
    }),
  );
}

describe("useListControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
  });

  it("paginates with the default page size and default (first) sort", () => {
    const { result } = setup();
    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.pageItems[0].title).toBe("Item 12"); // recent = created desc
    expect(result.current.pageCount).toBe(2);
    expect(result.current.page).toBe(1);
    expect(result.current.rangeStart).toBe(1);
    expect(result.current.rangeEnd).toBe(10);
    expect(result.current.totalFiltered).toBe(12);
    expect(result.current.totalAll).toBe(12);
  });

  it("navigates to a page and writes ?page= to the URL", () => {
    const { result } = setup();
    act(() => result.current.goToPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toHaveLength(2);
    expect(result.current.rangeStart).toBe(11);
    expect(result.current.rangeEnd).toBe(12);
    expect(replace).toHaveBeenLastCalledWith("/things?page=2", { scroll: false });
  });

  it("filters by search text, resets to page 1, and writes ?q=", () => {
    const { result } = setup("page=2");
    expect(result.current.page).toBe(2);
    act(() => result.current.setQuery("Item 01"));
    expect(result.current.totalFiltered).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems[0].title).toBe("Item 01");
    expect(replace).toHaveBeenLastCalledWith("/things?q=Item+01", { scroll: false });
  });

  it("changes sort order, resets page, and writes ?sort=", () => {
    const { result } = setup("page=2");
    act(() => result.current.setSortKey("title-asc"));
    expect(result.current.sortKey).toBe("title-asc");
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems[0].title).toBe("Item 01");
    expect(replace).toHaveBeenLastCalledWith("/things?sort=title-asc", { scroll: false });
  });

  it("clamps the page down when it exceeds the filtered range", () => {
    const { result } = setup("page=9");
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toHaveLength(2);
  });

  it("reset clears query, sort, page, and the URL", () => {
    const { result } = setup("q=Item+05&sort=title-asc&page=1");
    act(() => result.current.reset());
    expect(result.current.query).toBe("");
    expect(result.current.sortKey).toBe("recent");
    expect(result.current.totalFiltered).toBe(12);
    expect(replace).toHaveBeenLastCalledWith("/things", { scroll: false });
  });

  it("composes an extra predicate via getParam and reads initial extra params", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("kind=even"));
    const { result } = renderHook(() =>
      useListControls<Row>({
        items: rows,
        basePath: "/things",
        searchAccessor: (row) => row.title,
        sorts: SORTS,
        extraParamKeys: ["kind"],
        predicate: (row, { getParam }) =>
          getParam("kind") !== "even" || row.id % 2 === 0,
      }),
    );
    expect(result.current.getParam("kind")).toBe("even");
    expect(result.current.totalFiltered).toBe(6);
    act(() => result.current.setParam("kind", null));
    expect(result.current.totalFiltered).toBe(12);
    expect(replace).toHaveBeenLastCalledWith("/things", { scroll: false });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/lib/list-controls/use-list-controls.test.ts`
Expected: FAIL — `Failed to resolve import "./use-list-controls"`.

- [ ] **Step 4: Implement the hook**

Create `frontend/src/lib/list-controls/use-list-controls.ts`:

```ts
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ListControlsConfig, ListControlsResult } from "./types";

export const DEFAULT_PAGE_SIZE = 10;

type ControlState = {
  query: string;
  sortKey: string;
  page: number;
  extras: Record<string, string>;
};

function readState(
  searchParams: URLSearchParams,
  sortKeys: string[],
  defaultSortKey: string,
  extraParamKeys: string[],
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
  };
}

export function useListControls<T>(
  config: ListControlsConfig<T>,
): ListControlsResult<T> {
  const {
    items,
    basePath,
    searchAccessor,
    sorts,
    pageSize = DEFAULT_PAGE_SIZE,
    predicate,
    extraParamKeys = [],
  } = config;

  const router = useRouter();
  const searchParams = useSearchParams();
  const sortKeys = sorts.map((sort) => sort.key);
  const defaultSortKey = sorts[0].key;

  const [state, setState] = useState<ControlState>(() =>
    readState(searchParams, sortKeys, defaultSortKey, extraParamKeys),
  );

  function getParam(key: string): string | null {
    return state.extras[key] ?? null;
  }

  function writeUrl(next: ControlState) {
    const params = new URLSearchParams();
    const query = next.query.trim();
    if (query) params.set("q", query);
    if (next.sortKey !== defaultSortKey) params.set("sort", next.sortKey);
    if (next.page > 1) params.set("page", String(next.page));
    for (const key of extraParamKeys) {
      const value = next.extras[key];
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function update(partial: Partial<ControlState>, resetPage: boolean) {
    const next: ControlState = {
      ...state,
      ...partial,
      page: resetPage ? 1 : partial.page ?? state.page,
    };
    setState(next);
    writeUrl(next);
  }

  function setQuery(value: string) {
    update({ query: value }, true);
  }

  function setSortKey(key: string) {
    update({ sortKey: key }, true);
  }

  function setParam(key: string, value: string | null) {
    const extras = { ...state.extras };
    if (value === null || value === "") {
      delete extras[key];
    } else {
      extras[key] = value;
    }
    update({ extras }, true);
  }

  function goToPage(page: number) {
    update({ page }, false);
  }

  function reset() {
    update({ query: "", sortKey: defaultSortKey, extras: {}, page: 1 }, true);
  }

  const activeSort =
    sorts.find((sort) => sort.key === state.sortKey) ?? sorts[0];
  const needle = state.query.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
    const matchesQuery =
      needle === "" ||
      searchAccessor(item).toLocaleLowerCase().includes(needle);
    if (!matchesQuery) return false;
    if (predicate && !predicate(item, { getParam })) return false;
    return true;
  });
  const sorted = [...filtered].sort(activeSort.compare);
  const totalFiltered = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const rangeStart = totalFiltered === 0 ? 0 : start + 1;
  const rangeEnd = start + pageItems.length;

  return {
    pageItems,
    totalFiltered,
    totalAll: items.length,
    rangeStart,
    rangeEnd,
    page,
    pageCount,
    query: state.query,
    setQuery,
    sortKey: state.sortKey,
    setSortKey,
    getParam,
    setParam,
    goToPage,
    reset,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/lib/list-controls/use-list-controls.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/list-controls
git commit -m "feat(list-controls): add useListControls hook and types" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `Pagination` primitive

**Files:**
- Create: `frontend/src/components/ui/pagination.tsx`
- Test: `frontend/src/components/ui/pagination.test.tsx`

**Interfaces:**
- Produces `Pagination` with props `{ page: number; pageCount: number; onPageChange: (page: number) => void; className?: string }`.
- Renders nothing when `pageCount <= 1`. Buttons: `aria-label="Previous page"`, `aria-label="Page {n}"` (current has `aria-current="page"`), `aria-label="Next page"`.
- Consumed by Tasks 5–11.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/pagination.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders nothing when there is a single page", () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the current page and disables Previous on the first page", () => {
    render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });

  it("fires onPageChange for a numbered page and disables Next on the last page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/components/ui/pagination.test.tsx`
Expected: FAIL — `Failed to resolve import "./pagination"`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/ui/pagination.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft data-icon="inline-start" />
        Previous
      </Button>
      {pages.map((n) => (
        <Button
          key={n}
          type="button"
          variant={n === page ? "default" : "outline"}
          size="sm"
          aria-label={`Page ${n}`}
          aria-current={n === page ? "page" : undefined}
          onClick={() => onPageChange(n)}
        >
          {n}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight data-icon="inline-end" />
      </Button>
    </nav>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/components/ui/pagination.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/pagination.tsx frontend/src/components/ui/pagination.test.tsx
git commit -m "feat(ui): add numbered Pagination primitive" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `SortSelect` primitive

**Files:**
- Create: `frontend/src/components/ui/sort-select.tsx`
- Test: `frontend/src/components/ui/sort-select.test.tsx`

**Interfaces:**
- Produces `SortSelect` with props `{ value: string; options: { key: string; label: string }[]; onValueChange: (key: string) => void; ariaLabel?: string; className?: string }`. `ariaLabel` defaults to `"Sort"`.
- Accepts `SortOption<T>[]` directly for `options` (structurally compatible — extra `compare` field is ignored).
- Consumed by Tasks 5–11.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/sort-select.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SortSelect } from "./sort-select";

const options = [
  { key: "recent", label: "Recent" },
  { key: "title-asc", label: "Title A–Z" },
];

describe("SortSelect", () => {
  it("reflects the active option label", () => {
    render(<SortSelect value="title-asc" options={options} onValueChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent(
      "Title A–Z",
    );
  });

  it("fires onValueChange when a new option is chosen", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SortSelect value="recent" options={options} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Title A–Z" }));
    expect(onValueChange).toHaveBeenCalledWith("title-asc");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/components/ui/sort-select.test.tsx`
Expected: FAIL — `Failed to resolve import "./sort-select"`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/ui/sort-select.tsx`:

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortSelectOption = {
  key: string;
  label: string;
};

type SortSelectProps = {
  value: string;
  options: SortSelectOption[];
  onValueChange: (key: string) => void;
  ariaLabel?: string;
  className?: string;
};

export function SortSelect({
  value,
  options,
  onValueChange,
  ariaLabel = "Sort",
  className,
}: SortSelectProps) {
  return (
    <Select
      items={Object.fromEntries(
        options.map((option) => [option.key, option.label]),
      )}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(String(next));
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("h-10 w-full bg-card/60 sm:w-48", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/components/ui/sort-select.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/sort-select.tsx frontend/src/components/ui/sort-select.test.tsx
git commit -m "feat(ui): add SortSelect primitive wrapping base-ui Select" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `SearchInput` primitive

**Files:**
- Create: `frontend/src/components/ui/search-input.tsx`
- Test: `frontend/src/components/ui/search-input.test.tsx`

**Interfaces:**
- Produces `SearchInput` with props `{ value: string; onChange: (value: string) => void; placeholder?: string; className?: string }`. `placeholder` defaults to `"Search..."`.
- Renders `<input type="search">` (role `searchbox`) with a leading Search icon. Extracted from the current `ProjectFilters` search box.
- Consumed by Tasks 5–11.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/search-input.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  it("renders the controlled value and placeholder", () => {
    render(
      <SearchInput value="hello" onChange={vi.fn()} placeholder="Search things..." />,
    );
    const box = screen.getByRole("searchbox");
    expect(box).toHaveValue("hello");
    expect(box).toHaveAttribute("placeholder", "Search things...");
  });

  it("fires onChange with the typed character", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/components/ui/search-input.test.tsx`
Expected: FAIL — `Failed to resolve import "./search-input"`.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/ui/search-input.tsx`:

```tsx
"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative min-w-0 flex-1 lg:max-w-md", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="h-10 bg-card/60 pl-9"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/components/ui/search-input.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/search-input.tsx frontend/src/components/ui/search-input.test.tsx
git commit -m "feat(ui): add SearchInput primitive" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Projects integration (hook + sort + pagination; keep category/technology filters)

**Files:**
- Modify: `frontend/src/features/projects/components/project-filters.tsx` (remove search box; category/technology selects become granular-handler props)
- Modify: `frontend/src/features/projects/components/projects-view.tsx` (use hook)
- Test: `frontend/src/features/projects/components/projects-view.test.tsx` (update existing + add sort test)

**Interfaces:**
- Consumes `useListControls` (Task 1), `SearchInput` (Task 4), `SortSelect` (Task 3), `Pagination` (Task 2).
- New `ProjectFilters` props: `{ categoryId: number | null; technologyId: number | null; categories: CategoryOption[]; technologies: TechnologyOption[]; onCategoryChange: (id: number | null) => void; onTechnologyChange: (id: number | null) => void; onClear: () => void; showClear: boolean }`. The exported `ProjectFiltersValue` type is removed.
- Projects sort keys: `recent` (default), `oldest`, `title-asc`, `title-desc`. Extra param keys: `["category", "technology"]`.

- [ ] **Step 1: Update the projects test to describe the new behavior (failing)**

Replace the entire contents of `frontend/src/features/projects/components/projects-view.test.tsx` with:

```tsx
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter,
  useSearchParams,
}));
vi.mock("sonner", () => ({ toast }));

import type { Project } from "../types";
import { ProjectsView } from "./projects-view";

const projects: Project[] = [
  {
    id: 1,
    title: "Portfolio Manager",
    description: "Open-source portfolio CMS",
    repositoryUrl: "https://github.com/example/portfolio",
    liveUrl: null,
    category: { id: 3, name: "Full Stack" },
    technologies: [
      { id: 2, name: "TypeScript" },
      { id: 4, name: "PostgreSQL" },
    ],
    coverImage: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Chat API",
    description: "Realtime messaging backend",
    repositoryUrl: null,
    liveUrl: null,
    category: { id: 5, name: "Backend" },
    technologies: [{ id: 2, name: "TypeScript" }],
    coverImage: null,
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z",
  },
];

describe("ProjectsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("filters projects and stores valid filters in the URL", async () => {
    const user = userEvent.setup();

    render(
      <ProjectsView
        projects={projects}
        categories={[
          { id: 3, name: "Full Stack" },
          { id: 5, name: "Backend" },
        ]}
        technologies={[
          { id: 2, name: "TypeScript" },
          { id: 4, name: "PostgreSQL" },
        ]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const table = screen.getByRole("table");
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "All categories",
    );
    expect(
      screen.getByRole("combobox", { name: "Technology" }),
    ).toHaveTextContent("All technologies");
    await user.type(screen.getByRole("searchbox"), "portfolio");
    expect(within(table).getByText("Portfolio Manager")).toBeInTheDocument();
    expect(within(table).queryByText("Chat API")).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/projects?q=portfolio", {
      scroll: false,
    });

    await user.clear(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "Full Stack" }));
    await user.click(screen.getByRole("combobox", { name: "Technology" }));
    await user.click(screen.getByRole("option", { name: "PostgreSQL" }));

    expect(within(table).getByText("Portfolio Manager")).toBeInTheDocument();
    expect(within(table).queryByText("Chat API")).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      "/projects?category=3&technology=4",
      { scroll: false },
    );
  });

  it("sorts projects and stores the sort key in the URL", async () => {
    const user = userEvent.setup();

    render(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Default sort is "recent" (createdAt desc): Chat API (06-02) first.
    let rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Chat API");

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Title Z–A" }));

    expect(replace).toHaveBeenLastCalledWith("/projects?sort=title-desc", {
      scroll: false,
    });
    rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Portfolio Manager");
  });

  it("shows loading, error, and empty portfolio states", () => {
    const { rerender } = render(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("status", { name: "Loading projects" }),
    ).toBeInTheDocument();

    rerender(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={new Error("Projects request failed")}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Projects unavailable" }),
    ).toBeInTheDocument();

    rerender(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first project" }),
    ).toHaveAttribute("href", "/projects/new");
  });

  it("shows one-time create feedback and cleans the URL", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("created=1"));

    render(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Project created successfully",
      ),
    );
    expect(replace).toHaveBeenCalledWith("/projects", { scroll: false });
  });

  it("confirms deletion and closes the dialog on success", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete Portfolio Manager?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    expect(onDelete).toHaveBeenCalledWith(projects[0]);
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Delete Portfolio Manager?" }),
      ).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("Project deleted");
  });

  it("keeps the deletion dialog open when the request fails", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue({
      message: "Project could not be deleted",
    });

    render(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Project could not be deleted",
    );
    expect(
      screen.getByRole("heading", { name: "Delete Portfolio Manager?" }),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Project could not be deleted",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/projects/components/projects-view.test.tsx`
Expected: FAIL — the "Sort" combobox and `?sort=title-desc` write don't exist yet.

- [ ] **Step 3: Refactor `ProjectFilters` (remove search box, granular handlers)**

Replace the entire contents of `frontend/src/features/projects/components/project-filters.tsx` with:

```tsx
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption, TechnologyOption } from "../types";

type ProjectFiltersProps = {
  categoryId: number | null;
  technologyId: number | null;
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  onCategoryChange: (id: number | null) => void;
  onTechnologyChange: (id: number | null) => void;
  onClear: () => void;
  showClear: boolean;
};

export function ProjectFilters({
  categoryId,
  technologyId,
  categories,
  technologies,
  onCategoryChange,
  onTechnologyChange,
  onClear,
  showClear,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          items={Object.fromEntries([
            ["all", "All categories"],
            ...categories.map((category) => [
              category.id.toString(),
              category.name,
            ]),
          ])}
          value={categoryId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onCategoryChange(
              nextValue && nextValue !== "all" ? Number(nextValue) : null,
            )
          }
        >
          <SelectTrigger
            aria-label="Category"
            className="h-10 w-full bg-card/60 sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={Object.fromEntries([
            ["all", "All technologies"],
            ...technologies.map((technology) => [
              technology.id.toString(),
              technology.name,
            ]),
          ])}
          value={technologyId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onTechnologyChange(
              nextValue && nextValue !== "all" ? Number(nextValue) : null,
            )
          }
        >
          <SelectTrigger
            aria-label="Technology"
            className="h-10 w-full bg-card/60 sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All technologies</SelectItem>
            {technologies.map((technology) => (
              <SelectItem key={technology.id} value={technology.id.toString()}>
                {technology.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          className="h-10 justify-center sm:justify-start"
          onClick={onClear}
        >
          <X data-icon="inline-start" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `projects-view.tsx` to use the hook**

Replace the entire contents of `frontend/src/features/projects/components/projects-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { CategoryOption, Project, TechnologyOption } from "../types";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectFilters } from "./project-filters";
import { ProjectMobileList } from "./project-mobile-list";
import { ProjectSummary } from "./project-summary";
import { ProjectTable } from "./project-table";

type ProjectsViewProps = {
  projects: Project[];
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (project: Project) => Promise<void>;
};

const PROJECT_SORTS: SortOption<Project>[] = [
  { key: "recent", label: "Recent", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  { key: "oldest", label: "Oldest", compare: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
  { key: "title-desc", label: "Title Z–A", compare: (a, b) => b.title.localeCompare(a.title) },
];

function positiveOption(value: string | null, options: Array<{ id: number }>) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && options.some((item) => item.id === id)
    ? id
    : null;
}

function ProjectsSkeleton() {
  return (
    <div role="status" aria-label="Loading projects" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-32 sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}

export function ProjectsView({
  projects,
  categories,
  technologies,
  isPending,
  error,
  onRetry,
  onDelete,
}: ProjectsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const controls = useListControls<Project>({
    items: projects,
    basePath: "/projects",
    searchAccessor: (project) => `${project.title} ${project.description}`,
    sorts: PROJECT_SORTS,
    extraParamKeys: ["category", "technology"],
    predicate: (project, { getParam }) => {
      const categoryId = positiveOption(getParam("category"), categories);
      const technologyId = positiveOption(getParam("technology"), technologies);
      const matchesCategory =
        categoryId === null || project.category.id === categoryId;
      const matchesTechnology =
        technologyId === null ||
        project.technologies.some((technology) => technology.id === technologyId);
      return matchesCategory && matchesTechnology;
    },
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) {
      return;
    }

    toast.success(
      created ? "Project created successfully" : "Project updated successfully",
    );
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const queryString = nextParams.toString();
    router.replace(queryString ? `/projects?${queryString}` : "/projects", {
      scroll: false,
    });
  }, [router, searchParams]);

  if (isPending) {
    return <ProjectsSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Projects unavailable"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  const selectedCategory = positiveOption(controls.getParam("category"), categories);
  const selectedTechnology = positiveOption(
    controls.getParam("technology"),
    technologies,
  );
  const hasActiveFilters =
    controls.query !== "" ||
    selectedCategory !== null ||
    selectedTechnology !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the projects displayed in your public portfolio.
          </p>
        </div>
        <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          New Project
        </Link>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start presenting your work."
          icon={<FolderPlus className="size-5" aria-hidden="true" />}
          action={
            <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
              Create your first project
            </Link>
          }
        />
      ) : (
        <>
          <ProjectSummary projects={projects} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search projects..."
            />
            <SortSelect
              value={controls.sortKey}
              options={PROJECT_SORTS}
              onValueChange={controls.setSortKey}
            />
            <ProjectFilters
              categoryId={selectedCategory}
              technologyId={selectedTechnology}
              categories={categories}
              technologies={technologies}
              onCategoryChange={(id) =>
                controls.setParam("category", id === null ? null : String(id))
              }
              onTechnologyChange={(id) =>
                controls.setParam("technology", id === null ? null : String(id))
              }
              onClear={controls.reset}
              showClear={hasActiveFilters}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching projects"
              description="Adjust or clear the filters to see more projects."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <ProjectTable
                projects={controls.pageItems}
                onDelete={setProjectToDelete}
              />
              <ProjectMobileList
                projects={controls.pageItems}
                onDelete={setProjectToDelete}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of{" "}
                  {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteProjectDialog
        project={projectToDelete}
        open={projectToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run the projects test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/projects/components/projects-view.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Verify nothing else imported the removed `ProjectFiltersValue`**

Run: `git grep -n "ProjectFiltersValue" -- frontend/src`
Expected: no output (empty). If any match appears, that file must switch to the new granular props before proceeding.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/projects/components/project-filters.tsx frontend/src/features/projects/components/projects-view.tsx frontend/src/features/projects/components/projects-view.test.tsx
git commit -m "feat(projects): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Experience integration

**Files:**
- Modify: `frontend/src/features/experience/components/experience-view.tsx`
- Test: `frontend/src/features/experience/components/experience-view.test.tsx`

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `recent` (default, `startDate` desc), `oldest` (`startDate` asc), `title-asc`. searchAccessor: `title` + `companyName`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/experience/components/experience-view.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));

import type { ExperienceEntry } from "../types";
import { ExperienceView } from "./experience-view";

const entries: ExperienceEntry[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return {
    id: index + 1,
    title: `Role ${label}`,
    companyName: `Company ${label}`,
    description: "desc",
    startDate: `${2013 + index}-01-01`,
    endDate: null,
    current: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
});

describe("ExperienceView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    render(
      <ExperienceView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Role 12")).toBeInTheDocument(); // newest start
    expect(within(table).queryByText("Role 01")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/experience?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Role 01")).toBeInTheDocument();
  });

  it("searches entries and writes ?q=", async () => {
    const user = userEvent.setup();
    render(
      <ExperienceView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "Role 05");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/experience?q=Role+05", {
      scroll: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/experience/components/experience-view.test.tsx`
Expected: FAIL — no searchbox / no "Showing" line yet.

- [ ] **Step 3: Rewrite `experience-view.tsx`**

Replace the entire contents of `frontend/src/features/experience/components/experience-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { ExperienceEntry } from "../types";
import { DeleteExperienceDialog } from "./delete-experience-dialog";
import { ExperienceMobileList } from "./experience-mobile-list";
import { ExperienceTable } from "./experience-table";

type ExperienceViewProps = {
  entries: ExperienceEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: ExperienceEntry) => Promise<void>;
};

const EXPERIENCE_SORTS: SortOption<ExperienceEntry>[] = [
  { key: "recent", label: "Newest start", compare: (a, b) => b.startDate.localeCompare(a.startDate) },
  { key: "oldest", label: "Oldest start", compare: (a, b) => a.startDate.localeCompare(b.startDate) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

function ExperienceSkeleton() {
  return (
    <div role="status" aria-label="Loading experience" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function ExperienceView({
  entries,
  isPending,
  error,
  onRetry,
  onDelete,
}: ExperienceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<ExperienceEntry | null>(null);

  const controls = useListControls<ExperienceEntry>({
    items: entries,
    basePath: "/experience",
    searchAccessor: (entry) => `${entry.title} ${entry.companyName}`,
    sorts: EXPERIENCE_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Experience created successfully" : "Experience updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/experience?${qs}` : "/experience", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <ExperienceSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Experience unavailable"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Experience
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage work experience displayed in your public portfolio.
          </p>
        </div>
        <Link href="/experience/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Experience
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No experience yet"
          description="Add your first work experience to start building your career history."
          icon={<Briefcase className="size-5" aria-hidden="true" />}
          action={
            <Link href="/experience/new" className={buttonVariants({ size: "lg" })}>
              Add your first experience
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search experience..."
            />
            <SortSelect
              value={controls.sortKey}
              options={EXPERIENCE_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching experience"
              description="Adjust or clear the search to see more entries."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <ExperienceTable entries={controls.pageItems} onDelete={setEntryToDelete} />
              <ExperienceMobileList entries={controls.pageItems} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteExperienceDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/experience/components/experience-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/experience/components/experience-view.tsx frontend/src/features/experience/components/experience-view.test.tsx
git commit -m "feat(experience): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Education integration (+ e2e seed + e2e spec)

**Files:**
- Modify: `frontend/src/features/education/components/education-view.tsx`
- Test: `frontend/src/features/education/components/education-view.test.tsx`
- Modify: `backend/prisma/e2e-seed.ts` (seed 12 education rows for the verified e2e user)
- Modify: `frontend/e2e/education.spec.ts` (adjust the delete assertion; add a pagination/sort/search test)

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `recent` (default, `startDate` desc), `oldest`, `title-asc`. searchAccessor: `title` + `institutionName`.
- e2e seed adds rows titled `Seeded Education 01..12`, `start_date` = `2013-01-01 .. 2024-01-01` (year = 2013 + index), for the verified user, inserted right after the existing `f_education.deleteMany` so each run is idempotent.

- [ ] **Step 1: Write the failing unit test**

Create `frontend/src/features/education/components/education-view.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));

import type { EducationEntry } from "../types";
import { EducationView } from "./education-view";

const entries: EducationEntry[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return {
    id: index + 1,
    title: `Degree ${label}`,
    institutionName: `School ${label}`,
    description: null,
    startDate: `${2013 + index}-01-01`,
    endDate: null,
    current: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
});

describe("EducationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    render(
      <EducationView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Degree 12")).toBeInTheDocument();
    expect(within(table).queryByText("Degree 01")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/education?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Degree 01")).toBeInTheDocument();
  });

  it("sorts by oldest start and writes ?sort=oldest", async () => {
    const user = userEvent.setup();
    render(
      <EducationView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Oldest start" }));
    expect(replace).toHaveBeenLastCalledWith("/education?sort=oldest", {
      scroll: false,
    });
    expect(
      within(screen.getByRole("table")).getByText("Degree 01"),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/education/components/education-view.test.tsx`
Expected: FAIL — no searchbox / Sort combobox yet.

- [ ] **Step 3: Rewrite `education-view.tsx`**

Replace the entire contents of `frontend/src/features/education/components/education-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { EducationEntry } from "../types";
import { DeleteEducationDialog } from "./delete-education-dialog";
import { EducationMobileList } from "./education-mobile-list";
import { EducationTable } from "./education-table";

type EducationViewProps = {
  entries: EducationEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: EducationEntry) => Promise<void>;
};

const EDUCATION_SORTS: SortOption<EducationEntry>[] = [
  { key: "recent", label: "Newest start", compare: (a, b) => b.startDate.localeCompare(a.startDate) },
  { key: "oldest", label: "Oldest start", compare: (a, b) => a.startDate.localeCompare(b.startDate) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

function EducationSkeleton() {
  return (
    <div role="status" aria-label="Loading education" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function EducationView({
  entries,
  isPending,
  error,
  onRetry,
  onDelete,
}: EducationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<EducationEntry | null>(null);

  const controls = useListControls<EducationEntry>({
    items: entries,
    basePath: "/education",
    searchAccessor: (entry) => `${entry.title} ${entry.institutionName}`,
    sorts: EDUCATION_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Education created successfully" : "Education updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/education?${qs}` : "/education", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <EducationSkeleton />;
  if (error) {
    return (
      <ErrorState title="Education unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Education
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage education history displayed in your public portfolio.
          </p>
        </div>
        <Link href="/education/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Education
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No education yet"
          description="Add your first education entry to showcase your academic background."
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          action={
            <Link href="/education/new" className={buttonVariants({ size: "lg" })}>
              Add your first education
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search education..."
            />
            <SortSelect
              value={controls.sortKey}
              options={EDUCATION_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching education"
              description="Adjust or clear the search to see more entries."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <EducationTable entries={controls.pageItems} onDelete={setEntryToDelete} />
              <EducationMobileList entries={controls.pageItems} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteEducationDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/education/components/education-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Seed 12 education rows for the e2e user**

In `backend/prisma/e2e-seed.ts`, find this line:

```ts
  await prisma.f_education.deleteMany({ where: { f_userId: verified.id } });
```

Insert immediately AFTER it:

```ts
  await prisma.f_education.createMany({
    data: Array.from({ length: 12 }, (_, index) => {
      const label = String(index + 1).padStart(2, '0');
      return {
        title: `Seeded Education ${label}`,
        institution_name: `Seeded University ${label}`,
        description: null,
        start_date: new Date(`${2013 + index}-01-01T00:00:00.000Z`),
        end_date: null,
        current: false,
        f_userId: verified.id,
      };
    }),
  });
```

- [ ] **Step 6: Adjust the existing education e2e delete assertion and add the pagination test**

In `frontend/e2e/education.spec.ts`, replace this block (end of the existing test):

```ts
    await page.getByRole("button", { name: `Delete ${degree}` }).click();
    await page.getByRole("button", { name: "Delete education" }).click();
    await expect(
      page.getByRole("heading", { name: "No education yet" }),
    ).toBeVisible();
  });
});
```

with:

```ts
    await page.getByRole("button", { name: `Delete ${degree}` }).click();
    await page.getByRole("button", { name: "Delete education" }).click();
    // 12 seeded rows remain, so the list is never empty — assert the deleted
    // entry is gone instead of the empty-state heading.
    await expect(page.getByText(degree)).toHaveCount(0);
  });

  test("paginates, sorts, and searches the education list", async ({ page }) => {
    await page.goto("/education");

    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 12").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText("Seeded Education 01")).toHaveCount(0);

    // Page 2 holds the two oldest seeded entries.
    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page.getByText("Showing 11–12 of 12")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 01").filter({ visible: true }),
    ).toBeVisible();

    // Oldest-start sort brings the oldest entry onto page 1.
    await page.getByRole("button", { name: "Page 1" }).click();
    await page.getByRole("combobox", { name: "Sort" }).click();
    await page.getByRole("option", { name: "Oldest start" }).click();
    await expect(
      page.getByText("Seeded Education 01").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText("Seeded Education 12")).toHaveCount(0);

    // Search narrows to a single row.
    await page.getByRole("searchbox").fill("Seeded Education 05");
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 05").filter({ visible: true }),
    ).toBeVisible();
  });
});
```

- [ ] **Step 7: Run the education e2e (both projects) to verify both tests pass**

Run: `npm --prefix frontend run test:e2e -- education`
Expected: PASS — `education management › creates, edits, and deletes an education entry` and `education management › paginates, sorts, and searches the education list`, on both `chromium` and `mobile` projects.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/education/components/education-view.tsx frontend/src/features/education/components/education-view.test.tsx backend/prisma/e2e-seed.ts frontend/e2e/education.spec.ts
git commit -m "feat(education): search/sort/paginate via shared list controls + e2e" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Courses integration

**Files:**
- Modify: `frontend/src/features/courses/components/course-view.tsx`
- Test: `frontend/src/features/courses/components/course-view.test.tsx`

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `recent` (default, `startDate` desc), `oldest`, `title-asc`. searchAccessor: `title` + `institutionName`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/courses/components/course-view.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));

import type { CourseEntry } from "../types";
import { CourseView } from "./course-view";

const entries: CourseEntry[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return {
    id: index + 1,
    title: `Course ${label}`,
    institutionName: `Academy ${label}`,
    description: "desc",
    startDate: `${2013 + index}-01-01`,
    endDate: null,
    current: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
});

describe("CourseView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    render(
      <CourseView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByText("Course 12"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/courses?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByText("Course 01"),
    ).toBeInTheDocument();
  });

  it("searches entries and writes ?q=", async () => {
    const user = userEvent.setup();
    render(
      <CourseView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "Course 05");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/courses?q=Course+05", {
      scroll: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/courses/components/course-view.test.tsx`
Expected: FAIL — no searchbox / "Showing" line yet.

- [ ] **Step 3: Rewrite `course-view.tsx`**

Replace the entire contents of `frontend/src/features/courses/components/course-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { CourseEntry } from "../types";
import { DeleteCourseDialog } from "./delete-course-dialog";
import { CourseMobileList } from "./course-mobile-list";
import { CourseTable } from "./course-table";

type CourseViewProps = {
  entries: CourseEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: CourseEntry) => Promise<void>;
};

const COURSE_SORTS: SortOption<CourseEntry>[] = [
  { key: "recent", label: "Newest start", compare: (a, b) => b.startDate.localeCompare(a.startDate) },
  { key: "oldest", label: "Oldest start", compare: (a, b) => a.startDate.localeCompare(b.startDate) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

function CourseSkeleton() {
  return (
    <div role="status" aria-label="Loading courses" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function CourseView({
  entries,
  isPending,
  error,
  onRetry,
  onDelete,
}: CourseViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<CourseEntry | null>(null);

  const controls = useListControls<CourseEntry>({
    items: entries,
    basePath: "/courses",
    searchAccessor: (entry) => `${entry.title} ${entry.institutionName}`,
    sorts: COURSE_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Course created successfully" : "Course updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/courses?${qs}` : "/courses", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <CourseSkeleton />;
  if (error) {
    return (
      <ErrorState title="Courses unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Courses
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage courses and certifications displayed in your public portfolio.
          </p>
        </div>
        <Link href="/courses/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Course
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course or certification to showcase your learning."
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          action={
            <Link href="/courses/new" className={buttonVariants({ size: "lg" })}>
              Add your first course
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search courses..."
            />
            <SortSelect
              value={controls.sortKey}
              options={COURSE_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching courses"
              description="Adjust or clear the search to see more courses."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <CourseTable entries={controls.pageItems} onDelete={setEntryToDelete} />
              <CourseMobileList entries={controls.pageItems} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteCourseDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/courses/components/course-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/courses/components/course-view.tsx frontend/src/features/courses/components/course-view.test.tsx
git commit -m "feat(courses): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Categories integration

**Files:**
- Modify: `frontend/src/features/categories/components/category-view.tsx`
- Test: `frontend/src/features/categories/components/category-view.test.tsx`

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `name-asc` (default), `name-desc`. searchAccessor: `name`. Preserve the `canDelete` prop, passed through to `CategoryTable` / `CategoryMobileList`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/categories/components/category-view.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));

import type { CategoryEntry } from "../types";
import { CategoryView } from "./category-view";

const entries: CategoryEntry[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return { id: index + 1, name: `Category ${label}` };
});

describe("CategoryView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    render(
      <CategoryView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    // Default sort is name-asc: Category 01 first.
    expect(
      within(screen.getByRole("table")).getByText("Category 01"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/categories?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
  });

  it("searches entries and writes ?q=", async () => {
    const user = userEvent.setup();
    render(
      <CategoryView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "Category 07");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/categories?q=Category+07", {
      scroll: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/categories/components/category-view.test.tsx`
Expected: FAIL — no searchbox / "Showing" line yet.

- [ ] **Step 3: Rewrite `category-view.tsx`**

Replace the entire contents of `frontend/src/features/categories/components/category-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { CategoryEntry } from "../types";
import { CategoryMobileList } from "./category-mobile-list";
import { CategoryTable } from "./category-table";
import { DeleteCategoryDialog } from "./delete-category-dialog";

type CategoryViewProps = {
  entries: CategoryEntry[];
  isPending: boolean;
  error: Error | null;
  canDelete?: boolean;
  onRetry: () => void;
  onDelete: (entry: CategoryEntry) => Promise<void>;
};

const CATEGORY_SORTS: SortOption<CategoryEntry>[] = [
  { key: "name-asc", label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "name-desc", label: "Name Z–A", compare: (a, b) => b.name.localeCompare(a.name) },
];

function CategorySkeleton() {
  return (
    <div role="status" aria-label="Loading categories" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function CategoryView({
  entries,
  isPending,
  error,
  canDelete = true,
  onRetry,
  onDelete,
}: CategoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<CategoryEntry | null>(null);

  const controls = useListControls<CategoryEntry>({
    items: entries,
    basePath: "/categories",
    searchAccessor: (entry) => entry.name,
    sorts: CATEGORY_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Category created successfully" : "Category updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/categories?${qs}` : "/categories", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <CategorySkeleton />;
  if (error) {
    return (
      <ErrorState title="Categories unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Categories
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the categories used to group your projects.
          </p>
        </div>
        <Link href="/categories/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Category
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add your first category to start organizing your projects."
          icon={<Tags className="size-5" aria-hidden="true" />}
          action={
            <Link href="/categories/new" className={buttonVariants({ size: "lg" })}>
              Add your first category
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search categories..."
            />
            <SortSelect
              value={controls.sortKey}
              options={CATEGORY_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching categories"
              description="Adjust or clear the search to see more categories."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <CategoryTable entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
              <CategoryMobileList entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteCategoryDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/categories/components/category-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/categories/components/category-view.tsx frontend/src/features/categories/components/category-view.test.tsx
git commit -m "feat(categories): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Technologies integration

**Files:**
- Modify: `frontend/src/features/technologies/components/technology-view.tsx`
- Test: `frontend/src/features/technologies/components/technology-view.test.tsx`

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `name-asc` (default), `name-desc`. searchAccessor: `name`. Preserve `canDelete`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/technologies/components/technology-view.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));

import type { TechnologyEntry } from "../types";
import { TechnologyView } from "./technology-view";

const entries: TechnologyEntry[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return { id: index + 1, name: `Tech ${label}` };
});

describe("TechnologyView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    render(
      <TechnologyView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByText("Tech 01"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/technologies?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
  });

  it("sorts by name descending and writes ?sort=name-desc", async () => {
    const user = userEvent.setup();
    render(
      <TechnologyView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Name Z–A" }));
    expect(replace).toHaveBeenLastCalledWith("/technologies?sort=name-desc", {
      scroll: false,
    });
    expect(
      within(screen.getByRole("table")).getByText("Tech 12"),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/technologies/components/technology-view.test.tsx`
Expected: FAIL — no Sort combobox / "Showing" line yet.

- [ ] **Step 3: Rewrite `technology-view.tsx`**

Replace the entire contents of `frontend/src/features/technologies/components/technology-view.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Code2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { TechnologyEntry } from "../types";
import { DeleteTechnologyDialog } from "./delete-technology-dialog";
import { TechnologyMobileList } from "./technology-mobile-list";
import { TechnologyTable } from "./technology-table";

type TechnologyViewProps = {
  entries: TechnologyEntry[];
  isPending: boolean;
  error: Error | null;
  canDelete?: boolean;
  onRetry: () => void;
  onDelete: (entry: TechnologyEntry) => Promise<void>;
};

const TECHNOLOGY_SORTS: SortOption<TechnologyEntry>[] = [
  { key: "name-asc", label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "name-desc", label: "Name Z–A", compare: (a, b) => b.name.localeCompare(a.name) },
];

function TechnologySkeleton() {
  return (
    <div role="status" aria-label="Loading technologies" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function TechnologyView({
  entries,
  isPending,
  error,
  canDelete = true,
  onRetry,
  onDelete,
}: TechnologyViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<TechnologyEntry | null>(null);

  const controls = useListControls<TechnologyEntry>({
    items: entries,
    basePath: "/technologies",
    searchAccessor: (entry) => entry.name,
    sorts: TECHNOLOGY_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Technology created successfully" : "Technology updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/technologies?${qs}` : "/technologies", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <TechnologySkeleton />;
  if (error) {
    return (
      <ErrorState title="Technologies unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Technologies
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the technology tags attached to your projects.
          </p>
        </div>
        <Link href="/technologies/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Technology
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No technologies yet"
          description="Add your first technology to start tagging your projects."
          icon={<Code2 className="size-5" aria-hidden="true" />}
          action={
            <Link href="/technologies/new" className={buttonVariants({ size: "lg" })}>
              Add your first technology
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search technologies..."
            />
            <SortSelect
              value={controls.sortKey}
              options={TECHNOLOGY_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching technologies"
              description="Adjust or clear the search to see more technologies."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <TechnologyTable entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
              <TechnologyMobileList entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteTechnologyDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/technologies/components/technology-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/technologies/components/technology-view.tsx frontend/src/features/technologies/components/technology-view.test.tsx
git commit -m "feat(technologies): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Custom sections integration

**Files:**
- Modify: `frontend/src/features/custom-sections/components/sections-view.tsx`
- Test: `frontend/src/features/custom-sections/components/sections-view.test.tsx`

**Interfaces:**
- Consumes `useListControls`, `SearchInput`, `SortSelect`, `Pagination`.
- Sort keys: `order` (default — `order` asc, nulls last), `name-asc`, `name-desc`. searchAccessor: `name` + `description ?? ""`.
- This view has NO props: it reads `useSections()` / `useDeleteSection()`. The hook is called unconditionally (before the `isPending` / `error` early returns) with `items: sections.data ?? []`. Cards render from `controls.pageItems`; the total-zero empty state still keys off `sections.data`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/features/custom-sections/components/sections-view.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  replace,
  toast,
  useRouter,
  useSearchParams,
  useSections,
  useDeleteSection,
} = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useSections: vi.fn(),
  useDeleteSection: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));
vi.mock("../api/custom-sections-queries", () => ({
  useSections,
  useDeleteSection,
}));

import type { CustomSection } from "../types";
import { SectionsView } from "./sections-view";

const sections: CustomSection[] = Array.from({ length: 12 }, (_, index) => {
  const label = String(index + 1).padStart(2, "0");
  return {
    id: index + 1,
    name: `Section ${label}`,
    description: null,
    icon: null,
    fieldSchema: [],
    order: index + 1,
    items: [],
  };
});

describe("SectionsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
    useSections.mockReturnValue({
      data: sections,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    useDeleteSection.mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("paginates sections and moves to page 2", async () => {
    const user = userEvent.setup();
    render(<SectionsView />);

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    expect(screen.getByText("Section 01")).toBeInTheDocument();
    expect(screen.queryByText("Section 12")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/custom-sections?page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
    expect(screen.getByText("Section 12")).toBeInTheDocument();
  });

  it("searches sections and writes ?q=", async () => {
    const user = userEvent.setup();
    render(<SectionsView />);

    await user.type(screen.getByRole("searchbox"), "Section 03");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/custom-sections?q=Section+03", {
      scroll: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix frontend run test:run -- src/features/custom-sections/components/sections-view.test.tsx`
Expected: FAIL — no searchbox / "Showing" line yet.

- [ ] **Step 3: Rewrite `sections-view.tsx`**

Replace the entire contents of `frontend/src/features/custom-sections/components/sections-view.tsx` with:

```tsx
// frontend/src/features/custom-sections/components/sections-view.tsx
"use client";

import { Blocks, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import { useDeleteSection, useSections } from "../api/custom-sections-queries";
import type { CustomSection } from "../types";
import { DeleteSectionDialog } from "./delete-section-dialog";
import { ItemsDrawer } from "./items-drawer";
import { SectionCard } from "./section-card";

const SECTION_SORTS: SortOption<CustomSection>[] = [
  {
    key: "order",
    label: "Manual order",
    compare: (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
  },
  { key: "name-asc", label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "name-desc", label: "Name Z–A", compare: (a, b) => b.name.localeCompare(a.name) },
];

export function SectionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sections = useSections();
  const deleteSection = useDeleteSection();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CustomSection | null>(null);

  const controls = useListControls<CustomSection>({
    items: sections.data ?? [],
    basePath: "/custom-sections",
    searchAccessor: (section) => `${section.name} ${section.description ?? ""}`,
    sorts: SECTION_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Section created successfully" : "Section updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/custom-sections?${qs}` : "/custom-sections", { scroll: false });
  }, [router, searchParams]);

  if (sections.isPending) {
    return (
      <div role="status" aria-label="Loading custom sections" className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (sections.error) {
    return (
      <ErrorState
        title="Custom sections unavailable"
        description={sections.error.message}
        onRetry={() => void sections.refetch()}
      />
    );
  }

  const data = sections.data ?? [];
  const activeSection = data.find((s) => s.id === activeSectionId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Custom Sections
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Build custom sections with your own fields and items.
          </p>
        </div>
        <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Section
        </Link>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No custom sections yet"
          description="Create your first custom section to add tailored content to your portfolio."
          icon={<Blocks className="size-5" aria-hidden="true" />}
          action={
            <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
              Add your first section
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search sections..."
            />
            <SortSelect
              value={controls.sortKey}
              options={SECTION_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching sections"
              description="Adjust or clear the search to see more sections."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {controls.pageItems.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onManageItems={setActiveSectionId}
                    onDelete={setSectionToDelete}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <ItemsDrawer
        section={activeSection}
        open={activeSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveSectionId(null);
        }}
      />

      <DeleteSectionDialog
        section={sectionToDelete}
        open={sectionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSectionToDelete(null);
        }}
        onConfirm={async (section) => {
          await deleteSection.mutateAsync(section.id);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix frontend run test:run -- src/features/custom-sections/components/sections-view.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full frontend unit suite (regression gate)**

Run: `npm --prefix frontend run test:run`
Expected: PASS — all suites, including the pre-existing dashboard/auth/etc. tests, remain green.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/custom-sections/components/sections-view.tsx frontend/src/features/custom-sections/components/sections-view.test.tsx
git commit -m "feat(custom-sections): search/sort/paginate via shared list controls" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (after Task 11)

- [ ] Run the full frontend unit suite: `npm --prefix frontend run test:run` — all green.
- [ ] Run the education e2e: `npm --prefix frontend run test:e2e -- education` — both tests, both projects, green.
- [ ] Run lint: `npm --prefix frontend run lint` — no new errors.
- [ ] Manual smoke (optional): `npm --prefix frontend run dev`, visit each list, confirm search/sort/pagination and that the URL reflects state and is shareable.
