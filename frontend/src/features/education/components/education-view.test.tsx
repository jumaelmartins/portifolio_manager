import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
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
    order: index,
  };
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderView(ui: ReactElement) {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("EducationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("paginates entries and moves to page 2", async () => {
    const user = userEvent.setup();
    renderView(
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
    renderView(
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

  it("manual order: hides search and pagination, shows a reorder handle per entry", async () => {
    const user = userEvent.setup();
    renderView(
      <EducationView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Manual order" }));

    expect(screen.queryByPlaceholderText("Search education...")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    const reorderButtons = screen.getAllByRole("button", { name: /^Reorder / });
    expect(reorderButtons).toHaveLength(entries.length);
  });

  it("normal mode: shows search input and no reorder handles", () => {
    renderView(
      <EducationView
        entries={entries}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Search education...")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Reorder / })).toHaveLength(0);
  });
});
