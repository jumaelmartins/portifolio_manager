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
