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
    order: index,
  };
});

function renderView({
  search = "",
  entries: testEntries = [] as EducationEntry[],
  state = "active" as ContentState,
  onArchive = vi.fn(),
  onUnarchive = vi.fn(),
  onRestore = vi.fn(),
  onSoftDelete = vi.fn(),
  onPurge = vi.fn(async () => {}),
}: {
  search?: string;
  entries?: EducationEntry[];
  state?: ContentState;
  onArchive?: (entry: EducationEntry) => void;
  onUnarchive?: (entry: EducationEntry) => void;
  onRestore?: (entry: EducationEntry) => void;
  onSoftDelete?: (entry: EducationEntry) => void;
  onPurge?: (entry: EducationEntry) => Promise<void>;
} = {}) {
  useSearchParams.mockReturnValue(new URLSearchParams(search));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <EducationView
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

describe("EducationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    renderView({ entries });

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
    renderView({ entries });

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Oldest start" }));
    expect(replace).toHaveBeenLastCalledWith("/education?sort=oldest", {
      scroll: false,
    });
    expect(
      within(screen.getByRole("table")).getByText("Degree 01"),
    ).toBeInTheDocument();
  });

  it("renders a StateFilter tablist", () => {
    renderView({ entries });
    expect(screen.getByRole("tablist", { name: "Content state" })).toBeInTheDocument();
  });

  it("in active state, a row shows an Archive button that calls onArchive", async () => {
    const user = userEvent.setup();
    const { onArchive } = renderView({ entries, state: "active" });

    const table = screen.getByRole("table");
    const row = within(table).getByText("Degree 12").closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Archive Degree 12" }));
    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({ title: "Degree 12" }));
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

describe("EducationView manual order", () => {
  const manyEntries = entries;

  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("manual order: hides search and pagination, shows a reorder handle per entry", () => {
    renderView({ search: "sort=order", entries: manyEntries, state: "active" });
    expect(screen.queryByPlaceholderText("Search education...")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    const reorderButtons = screen.getAllByRole("button", { name: /^Reorder / });
    expect(reorderButtons).toHaveLength(manyEntries.length);
  });

  it("normal mode: shows search input and no reorder handles", () => {
    renderView({ search: "", entries: manyEntries, state: "active" });
    expect(screen.getByPlaceholderText("Search education...")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Reorder / })).toHaveLength(0);
  });
});
