import { describe, expect, it } from "vitest";

import { buildDashboard } from "./build-dashboard";

describe("buildDashboard", () => {
  it("derives only supported metrics and orders recent projects", () => {
    const result = buildDashboard({
      projects: [
        {
          id: 1,
          title: "A",
          coverImage: null,
          updatedAt: "2026-06-12T10:00:00Z",
        },
        {
          id: 2,
          title: "B",
          coverImage: { id: 9, url: "https://example.com/b.png" },
          updatedAt: "2026-06-11T10:00:00Z",
        },
      ],
      categories: [{ id: 1, name: "Full Stack" }],
      technologies: [{ id: 1, name: "TypeScript" }],
    });

    expect(result.metrics).toEqual({
      projects: 2,
      categories: 1,
      technologies: 1,
      withCover: 1,
      withoutCover: 1,
    });
    expect(result.recentProjects[0].title).toBe("A");
  });
});
