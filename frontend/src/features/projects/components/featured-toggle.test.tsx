import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../types";
import { renderWithProviders } from "@/test/render-with-providers";
import { FeaturedToggle } from "./featured-toggle";

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 1,
  title: "Portfolio Manager",
  description: "CMS",
  repositoryUrl: null,
  liveUrl: null,
  featured: false,
  category: { id: 3, name: "Full Stack" },
  technologies: [],
  coverImage: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
  order: 0,
  ...overrides,
});

describe("FeaturedToggle", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ id: 1, featured: true }), {
            status: 200,
          }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("labels the control as 'feature' when the project is not featured", () => {
    renderWithProviders(<FeaturedToggle project={project()} />);

    expect(
      screen.getByRole("button", { name: /feature Portfolio Manager/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("labels the control as 'unfeature' when the project is featured", () => {
    renderWithProviders(
      <FeaturedToggle project={project({ featured: true })} />,
    );

    expect(
      screen.getByRole("button", { name: /unfeature Portfolio Manager/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("sends a PATCH to the featured route with the flipped flag on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeaturedToggle project={project()} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/projects/1/featured",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ featured: true }),
        }),
      ),
    );
  });
});
