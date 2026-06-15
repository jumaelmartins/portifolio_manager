import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  useCategories,
  useDeleteProject,
  useProjects,
  useTechnologies,
} = vi.hoisted(() => ({
  useCategories: vi.fn(),
  useDeleteProject: vi.fn(),
  useProjects: vi.fn(),
  useTechnologies: vi.fn(),
}));

vi.mock("@/features/projects/api/project-queries", () => ({
  useCategories,
  useDeleteProject,
  useProjects,
  useTechnologies,
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
    useDeleteProject.mockReturnValue({ mutateAsync: vi.fn() });

    render(<ProjectsPage />);

    expect(
      screen.getByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
  });
});
