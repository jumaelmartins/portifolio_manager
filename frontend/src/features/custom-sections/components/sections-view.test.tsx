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
  useSections: vi.fn(),
  useDeleteSection: vi.fn(),
  useReorderSections: vi.fn(),
  useCreateItem: vi.fn(),
  useUpdateItem: vi.fn(),
  useDeleteItem: vi.fn(),
  useReorderItems: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));
vi.mock("../api/custom-sections-queries", () => ({
  useSections,
  useDeleteSection,
  useReorderSections,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
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
    useReorderSections.mockReturnValue({ mutate: vi.fn() });
    useCreateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useDeleteItem.mockReturnValue({ mutateAsync: vi.fn() });
    useReorderItems.mockReturnValue({ mutate: vi.fn() });
  });

  it("paginates sections and moves to page 2", async () => {
    const user = userEvent.setup();
    useSearchParams.mockReturnValue(new URLSearchParams("sort=name-asc"));
    render(<SectionsView />);

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
    useSearchParams.mockReturnValue(new URLSearchParams("sort=name-asc"));
    render(<SectionsView />);

    await user.type(screen.getByRole("searchbox"), "Section 03");
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/custom-sections?q=Section+03&sort=name-asc", {
      scroll: false,
    });
  });

  it("renders draggable section cards by default (manual order) and hides search", () => {
    render(<SectionsView />);

    expect(screen.queryByPlaceholderText("Search sections...")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Reorder / }).length).toBe(sections.length);
  });

  it("switching to Name A–Z shows search and the paginated grid (no drag handles)", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("sort=name-asc"));
    render(<SectionsView />);

    expect(screen.getByPlaceholderText("Search sections...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Reorder / })).not.toBeInTheDocument();
  });
});
