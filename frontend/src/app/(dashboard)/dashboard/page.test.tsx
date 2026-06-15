import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useDashboard, useSession } = vi.hoisted(() => ({
  useDashboard: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("@/features/dashboard/api/use-dashboard", () => ({ useDashboard }));
vi.mock("@/features/auth/api/use-session", () => ({ useSession }));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("connects session and dashboard queries to the overview", () => {
    useSession.mockReturnValue({
      data: { username: "Lucas Oliveira" },
    });
    useDashboard.mockReturnValue({
      data: {
        metrics: {
          projects: 4,
          categories: 2,
          technologies: 6,
          withCover: 3,
          withoutCover: 1,
        },
        recentProjects: [],
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Welcome back, Lucas.")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Projects: 4" }),
    ).toBeInTheDocument();
  });
});
