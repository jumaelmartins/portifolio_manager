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
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useSections: vi.fn(),
  useDeleteSection: vi.fn(),
  useCreateItem: vi.fn(),
  useUpdateItem: vi.fn(),
  useDeleteItem: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter, useSearchParams }));
vi.mock("sonner", () => ({ toast }));
vi.mock("../api/custom-sections-queries", () => ({
  useSections,
  useDeleteSection,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
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
    useCreateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useDeleteItem.mockReturnValue({ mutateAsync: vi.fn() });
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
