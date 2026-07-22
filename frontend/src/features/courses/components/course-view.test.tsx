import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import type { ContentState } from "@/lib/content-state";
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
    order: index,
  };
});

function renderView({
  search = "",
  entries: testEntries = [] as CourseEntry[],
  state = "active" as ContentState,
  onArchive = vi.fn(),
  onUnarchive = vi.fn(),
  onRestore = vi.fn(),
  onSoftDelete = vi.fn(),
  onPurge = vi.fn(async () => {}),
}: {
  search?: string;
  entries?: CourseEntry[];
  state?: ContentState;
  onArchive?: (entry: CourseEntry) => void;
  onUnarchive?: (entry: CourseEntry) => void;
  onRestore?: (entry: CourseEntry) => void;
  onSoftDelete?: (entry: CourseEntry) => void;
  onPurge?: (entry: CourseEntry) => Promise<void>;
} = {}) {
  useSearchParams.mockReturnValue(new URLSearchParams(search));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CourseView
        entries={testEntries}
        state={state}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onRestore={onRestore}
        onSoftDelete={onSoftDelete}
        onPurge={onPurge}
      />
    </QueryClientProvider>,
  );
  return { ...view, onArchive, onUnarchive, onRestore, onSoftDelete, onPurge };
}

describe("CourseView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    renderView({ entries });

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
    renderView({ entries });

    await user.type(screen.getByRole("searchbox"), "Course 05");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/courses?q=Course+05", {
      scroll: false,
    });
  });

  it("renders a StateFilter tablist", () => {
    renderView({ entries });
    expect(screen.getByRole("tablist", { name: "Content state" })).toBeInTheDocument();
  });

  it("in active state, a row shows an Archive button that calls onArchive", async () => {
    const user = userEvent.setup();
    const { onArchive } = renderView({ entries, state: "active" });

    const table = screen.getByRole("table");
    const row = within(table).getByText("Course 12").closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Archive Course 12" }));
    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({ title: "Course 12" }));
  });

  it("in trash state, a row shows Restore and Delete…permanently, and no Manual order sort option", () => {
    renderView({ entries, state: "trash" });

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("button", { name: /^Restore /}).length).toBeGreaterThan(0);
    expect(within(table).getAllByRole("button", { name: /permanently$/ }).length).toBeGreaterThan(0);

    // No "Manual order" option in the sort select while in trash.
    expect(screen.queryByText("Manual order")).not.toBeInTheDocument();
  });
});

describe("CourseView manual order", () => {
  const manyEntries = entries;

  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("under manual order: shows drag handles, hides search + pagination", () => {
    renderView({ search: "sort=order", entries: manyEntries, state: "active" });
    expect(screen.queryByPlaceholderText("Search courses...")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Reorder / }).length).toBe(manyEntries.length);
  });

  it("under a normal sort: shows search and no drag handles", () => {
    renderView({ search: "", entries: manyEntries, state: "active" });
    expect(screen.getByPlaceholderText("Search courses...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Reorder / })).not.toBeInTheDocument();
  });
});
