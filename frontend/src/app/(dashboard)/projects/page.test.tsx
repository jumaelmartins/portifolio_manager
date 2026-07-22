import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  useArchiveProject,
  useCategories,
  useDeleteProject,
  usePurgeProject,
  useProjects,
  useReorderProjects,
  useRestoreProject,
  useTechnologies,
  useUnarchiveProject,
} = vi.hoisted(() => ({
  useArchiveProject: vi.fn(),
  useCategories: vi.fn(),
  useDeleteProject: vi.fn(),
  usePurgeProject: vi.fn(),
  useProjects: vi.fn(),
  useReorderProjects: vi.fn(),
  useRestoreProject: vi.fn(),
  useTechnologies: vi.fn(),
  useUnarchiveProject: vi.fn(),
}));

vi.mock("@/features/projects/api/project-queries", () => ({
  useArchiveProject,
  useCategories,
  useDeleteProject,
  usePurgeProject,
  useProjects,
  useReorderProjects,
  useRestoreProject,
  useTechnologies,
  useUnarchiveProject,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("connects project queries to the management view", () => {
    useProjects.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    useCategories.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    useTechnologies.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    useDeleteProject.mockReturnValue({ mutate: vi.fn() });
    useReorderProjects.mockReturnValue({ mutate: vi.fn() });
    useArchiveProject.mockReturnValue({ mutate: vi.fn() });
    useUnarchiveProject.mockReturnValue({ mutate: vi.fn() });
    useRestoreProject.mockReturnValue({ mutate: vi.fn() });
    usePurgeProject.mockReturnValue({ mutateAsync: vi.fn() });

    render(<ProjectsPage />);

    expect(
      screen.getByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
  });
});
