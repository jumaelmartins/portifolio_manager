import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, toast, useRouter, useSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter,
  useSearchParams,
}));
vi.mock("sonner", () => ({ toast }));

import type { Project } from "../types";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProjectsView } from "./projects-view";

const projects: Project[] = [
  {
    id: 1,
    title: "Portfolio Manager",
    description: "Open-source portfolio CMS",
    repositoryUrl: "https://github.com/example/portfolio",
    liveUrl: null,
    category: { id: 3, name: "Full Stack" },
    technologies: [
      { id: 2, name: "TypeScript" },
      { id: 4, name: "PostgreSQL" },
    ],
    coverImage: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    order: 0,
  },
  {
    id: 2,
    title: "Chat API",
    description: "Realtime messaging backend",
    repositoryUrl: null,
    liveUrl: null,
    category: { id: 5, name: "Backend" },
    technologies: [{ id: 2, name: "TypeScript" }],
    coverImage: null,
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z",
    order: 1,
  },
];

describe("ProjectsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({ replace });
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("filters projects and stores valid filters in the URL", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[
          { id: 3, name: "Full Stack" },
          { id: 5, name: "Backend" },
        ]}
        technologies={[
          { id: 2, name: "TypeScript" },
          { id: 4, name: "PostgreSQL" },
        ]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    const table = screen.getByRole("table");
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "All categories",
    );
    expect(
      screen.getByRole("combobox", { name: "Technology" }),
    ).toHaveTextContent("All technologies");
    await user.type(screen.getByRole("searchbox"), "portfolio");
    expect(within(table).getByText("Portfolio Manager")).toBeInTheDocument();
    expect(within(table).queryByText("Chat API")).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/projects?q=portfolio", {
      scroll: false,
    });

    await user.clear(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "Full Stack" }));
    await user.click(screen.getByRole("combobox", { name: "Technology" }));
    await user.click(screen.getByRole("option", { name: "PostgreSQL" }));

    expect(within(table).getByText("Portfolio Manager")).toBeInTheDocument();
    expect(within(table).queryByText("Chat API")).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      "/projects?category=3&technology=4",
      { scroll: false },
    );
  });

  it("sorts projects and stores the sort key in the URL", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    // Default sort is "recent" (createdAt desc): Chat API (06-02) first.
    let rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Chat API");

    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("option", { name: "Title Z–A" }));

    expect(replace).toHaveBeenLastCalledWith("/projects?sort=title-desc", {
      scroll: false,
    });
    rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Portfolio Manager");
  });

  it("shows loading, error, and empty portfolio states", () => {
    const { rerender } = renderWithProviders(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        state="active"
        isPending
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    expect(
      screen.getByRole("status", { name: "Loading projects" }),
    ).toBeInTheDocument();

    rerender(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={new Error("Projects request failed")}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Projects unavailable" }),
    ).toBeInTheDocument();

    rerender(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first project" }),
    ).toHaveAttribute("href", "/projects/new");
  });

  it("shows one-time create feedback and cleans the URL", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("created=1"));

    renderWithProviders(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Project created successfully",
      ),
    );
    expect(replace).toHaveBeenCalledWith("/projects", { scroll: false });
  });

  it("renders a StateFilter tablist", () => {
    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );
    expect(screen.getByRole("tablist", { name: "Content state" })).toBeInTheDocument();
  });

  it("in active state, a row shows an Archive button that calls onArchive", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={onArchive}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    const table = screen.getByRole("table");
    const row = within(table).getByText("Portfolio Manager").closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Archive Portfolio Manager",
      }),
    );
    expect(onArchive).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Portfolio Manager" }),
    );
  });

  it("hides the project summary and category/technology filters outside Active, but keeps search available", () => {
    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[{ id: 3, name: "Full Stack" }]}
        technologies={[{ id: 2, name: "TypeScript" }]}
        state="archived"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    expect(
      screen.queryByRole("region", { name: "Project summary" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Category" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Technology" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("in trash state, a row shows Restore and Delete…permanently, and no Manual order sort option", () => {
    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="trash"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("button", { name: /^Restore /}).length).toBeGreaterThan(0);
    expect(within(table).getAllByRole("button", { name: /permanently$/ }).length).toBeGreaterThan(0);

    // No "Manual order" option in the sort select while in trash.
    expect(screen.queryByText("Manual order")).not.toBeInTheDocument();
  });

  it("confirms purge and closes the dialog on success", async () => {
    const user = userEvent.setup();
    const onPurge = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="trash"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={onPurge}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager permanently",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete Portfolio Manager?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    expect(onPurge).toHaveBeenCalledWith(projects[0]);
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Delete Portfolio Manager?" }),
      ).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("Project deleted");
  });

  it("keeps the purge dialog open when the request fails", async () => {
    const user = userEvent.setup();
    const onPurge = vi.fn().mockRejectedValue({
      message: "Project could not be deleted",
    });

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="trash"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={onPurge}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager permanently",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Project could not be deleted",
    );
    expect(
      screen.getByRole("heading", { name: "Delete Portfolio Manager?" }),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Project could not be deleted",
    );
  });

  it("under manual order: hides search and pagination, shows one Reorder button per project", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("sort=order"));

    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    const reorderButtons = screen.getAllByRole("button", { name: /^Reorder / });
    expect(reorderButtons).toHaveLength(projects.length);
  });

  it("under default sort: shows search input and no Reorder buttons", () => {
    renderWithProviders(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        state="active"
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onRestore={vi.fn()}
        onSoftDelete={vi.fn()}
        onPurge={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Reorder / })).toHaveLength(0);
  });
});
