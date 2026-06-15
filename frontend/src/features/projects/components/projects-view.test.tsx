import { render, screen, waitFor, within } from "@testing-library/react";
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

    render(
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
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
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

  it("shows loading, error, and empty portfolio states", () => {
    const { rerender } = render(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
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
        isPending={false}
        error={new Error("Projects request failed")}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
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
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
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

    render(
      <ProjectsView
        projects={[]}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Project created successfully",
      ),
    );
    expect(replace).toHaveBeenCalledWith("/projects", { scroll: false });
  });

  it("confirms deletion and closes the dialog on success", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete Portfolio Manager?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    expect(onDelete).toHaveBeenCalledWith(projects[0]);
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Delete Portfolio Manager?" }),
      ).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("Project deleted");
  });

  it("keeps the deletion dialog open when the request fails", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue({
      message: "Project could not be deleted",
    });

    render(
      <ProjectsView
        projects={projects}
        categories={[]}
        technologies={[]}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Delete Portfolio Manager",
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
});
