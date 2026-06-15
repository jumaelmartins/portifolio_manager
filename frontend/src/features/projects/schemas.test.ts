import { describe, expect, it } from "vitest";

import { projectSchema } from "./schemas";

const validProject = {
  title: "Portfolio Manager",
  description: "Open-source CMS",
  categoryId: 1,
  technologyIds: [2, 3],
  repositoryUrl: "https://github.com/example/repo",
  liveUrl: "https://portfolio.example.com",
  coverImageId: 9,
};

describe("projectSchema", () => {
  it("accepts a complete project input", () => {
    expect(projectSchema.safeParse(validProject).success).toBe(true);
  });

  it("rejects invalid external URLs", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      repositoryUrl: "github.com/example/repo",
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate technology IDs", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      technologyIds: [2, 2],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Choose each technology only once",
    );
  });

  it("allows empty optional URLs and no cover image", () => {
    expect(
      projectSchema.safeParse({
        ...validProject,
        repositoryUrl: "",
        liveUrl: "",
        coverImageId: null,
      }).success,
    ).toBe(true);
  });
});
