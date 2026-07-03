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
