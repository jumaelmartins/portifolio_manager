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
