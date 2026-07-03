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
