import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { DashboardData } from "../types";
import { DashboardView } from "./dashboard-view";

const dashboard: DashboardData = {
  metrics: {
    projects: 2,
    categories: 1,
    technologies: 3,
    withCover: 1,
    withoutCover: 1,
  },
  recentProjects: [
    {
      id: 7,
      title: "Portfolio Manager",
      description: "Open-source portfolio CMS",
      category: { id: 2, name: "Full Stack" },
      coverImage: {
        id: 9,
        url: "https://example.com/portfolio-cover.png",
      },
      updatedAt: "2026-06-12T10:00:00.000Z",
    },
  ],
};

describe("DashboardView", () => {
  it("renders a dashboard skeleton while data is loading", () => {
    render(
      <DashboardView
        data={undefined}
        isPending
        error={null}
        onRetry={vi.fn()}
        username="Lucas Oliveira"
      />,
    );

    expect(
      screen.getByRole("status", { name: "Loading dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders an actionable error state", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <DashboardView
        data={undefined}
        isPending={false}
        error={new Error("Unable to load dashboard")}
        onRetry={onRetry}
        username="Lucas Oliveira"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Dashboard unavailable" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders a useful empty state without fabricated activity", () => {
    render(
      <DashboardView
        data={{
          metrics: {
            projects: 0,
            categories: 0,
            technologies: 0,
            withCover: 0,
            withoutCover: 0,
          },
          recentProjects: [],
        }}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        username={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first project" }),
    ).toHaveAttribute("href", "/projects/new");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("renders supported metrics, actions, and recent projects", () => {
    render(
      <DashboardView
        data={dashboard}
        isPending={false}
        error={null}
        onRetry={vi.fn()}
        username="Lucas Oliveira"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Welcome back, Lucas.")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Projects: 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Technologies: 3" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New Project" })).toHaveAttribute(
      "href",
      "/projects/new",
    );
    expect(screen.getByRole("link", { name: "View Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(
      screen.getByRole("link", { name: /Portfolio Manager/ }),
    ).toHaveAttribute("href", "/projects/7");
    expect(screen.getByText("Full Stack")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });
});
