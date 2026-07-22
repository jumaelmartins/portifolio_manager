import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  replace,
  toast,
  useRouter,
  useSearchParams,
  useReorderSections,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
} = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useReorderSections: vi.fn(),
  useCreateItem: vi.fn(),
  useUpdateItem: vi.fn(),
  useDeleteItem: vi.fn(),
  useReorderItems: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));
vi.mock("../api/custom-sections-queries", () => ({
  useReorderSections,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
}));

import type { ContentState } from "@/lib/content-state";
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

function renderView({
  search = "",
  sections: testSections = [] as CustomSection[],
  state = "active" as ContentState,
  onArchive = vi.fn(),
  onUnarchive = vi.fn(),
  onRestore = vi.fn(),
  onSoftDelete = vi.fn(),
  onPurge = vi.fn(async () => {}),
}: {
  search?: string;
  sections?: CustomSection[];
  state?: ContentState;
  onArchive?: (section: CustomSection) => void;
  onUnarchive?: (section: CustomSection) => void;
  onRestore?: (section: CustomSection) => void;
  onSoftDelete?: (section: CustomSection) => void;
  onPurge?: (section: CustomSection) => Promise<void>;
} = {}) {
  useSearchParams.mockReturnValue(new URLSearchParams(search));
  const view = render(
    <SectionsView
      sections={testSections}
      state={state}
      isPending={false}
      error={null}
      onRetry={vi.fn()}
      onArchive={onArchive}
      onUnarchive={onUnarchive}
      onRestore={onRestore}
      onSoftDelete={onSoftDelete}
      onPurge={onPurge}
    />,
  );
  return { ...view, onArchive, onUnarchive, onRestore, onSoftDelete, onPurge };
}

describe("SectionsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
    useReorderSections.mockReturnValue({ mutate: vi.fn() });
    useCreateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useDeleteItem.mockReturnValue({ mutateAsync: vi.fn() });
    useReorderItems.mockReturnValue({ mutate: vi.fn() });
  });

  it("paginates sections and moves to page 2", async () => {
    const user = userEvent.setup();
    renderView({ search: "sort=name-asc", sections });

    expect(screen.getByText("Showing 1–10 of 12")).toBeInTheDocument();
    expect(screen.getByText("Section 01")).toBeInTheDocument();
    expect(screen.queryByText("Section 12")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace).toHaveBeenLastCalledWith("/custom-sections?sort=name-asc&page=2", {
      scroll: false,
    });
    expect(screen.getByText("Showing 11–12 of 12")).toBeInTheDocument();
    expect(screen.getByText("Section 12")).toBeInTheDocument();
  });

  it("searches sections and writes ?q=", async () => {
    const user = userEvent.setup();
    renderView({ search: "sort=name-asc", sections });

    await user.type(screen.getByRole("searchbox"), "Section 03");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/custom-sections?q=Section+03&sort=name-asc", {
      scroll: false,
    });
  });

  it("renders draggable section cards by default (manual order) and hides search", () => {
    renderView({ sections });

    expect(screen.queryByPlaceholderText("Search sections...")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Reorder / }).length).toBe(sections.length);
  });

  it("switching to Name A–Z shows search and the paginated grid (no drag handles)", () => {
    renderView({ search: "sort=name-asc", sections });

    expect(screen.getByPlaceholderText("Search sections...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Reorder / })).not.toBeInTheDocument();
  });

  it("renders a StateFilter tablist", () => {
    renderView({ sections });
    expect(screen.getByRole("tablist", { name: "Content state" })).toBeInTheDocument();
  });

  it("in active state, a card shows an Archive button that calls onArchive", async () => {
    const user = userEvent.setup();
    const { onArchive } = renderView({ sections, state: "active" });

    await user.click(screen.getByRole("button", { name: "Archive Section 01" }));
    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({ name: "Section 01" }));
  });

  it("in trash state: no Manual order sort option, no drag handles, Restore and Delete…permanently shown", () => {
    renderView({ sections, state: "trash" });

    expect(screen.queryByText("Manual order")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Reorder / })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Restore /}).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /permanently$/ }).length).toBeGreaterThan(0);
  });

  it("in trash state, clicking Delete…permanently opens the confirm dialog and confirming calls onPurge", async () => {
    const user = userEvent.setup();
    const onPurge = vi.fn(async () => {});
    renderView({ sections: [sections[0]], state: "trash", onPurge });

    await user.click(screen.getByRole("button", { name: /permanently$/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete section" }));
    expect(onPurge).toHaveBeenCalledWith(expect.objectContaining({ name: "Section 01" }));
  });

  it("in active state, clicking the trash icon calls onSoftDelete directly (no dialog)", async () => {
    const user = userEvent.setup();
    const onSoftDelete = vi.fn();
    renderView({ sections: [sections[0]], state: "active", onSoftDelete });

    await user.click(screen.getByRole("button", { name: "Move Section 01 to trash" }));
    expect(onSoftDelete).toHaveBeenCalledWith(expect.objectContaining({ name: "Section 01" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
