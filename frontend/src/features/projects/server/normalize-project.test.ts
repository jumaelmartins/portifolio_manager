import { describe, expect, it } from "vitest";

import {
  normalizeImage,
  normalizeProject,
  toBackendProjectInput,
} from "./normalize-project";

describe("normalizeProject", () => {
  it("maps backend project fields to the frontend contract", () => {
    expect(
      normalizeProject({
        id: 1,
        title: "Portfolio Manager",
        description: "CMS",
        repo_url: "https://github.com/example/repo",
        live_url: null,
        featured: true,
        d_categoryId: 3,
        f_imagesId: 9,
        category: { id: 3, category: "Full Stack" },
        technologies: [{ id: 2, tech: "TypeScript" }],
        f_images: {
          id: 9,
          description: null,
          url: "http://localhost:3000/uploads/1/cover.png",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
        },
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-12T00:00:00.000Z",
        order: 2,
      }),
    ).toEqual({
      id: 1,
      title: "Portfolio Manager",
      description: "CMS",
      repositoryUrl: "https://github.com/example/repo",
      liveUrl: null,
      featured: true,
      category: { id: 3, name: "Full Stack" },
      technologies: [{ id: 2, name: "TypeScript" }],
      coverImage: {
        id: 9,
        description: null,
        url: "/api/uploads/file/1/cover.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        usage: { projects: [], isProfilePicture: false },
      },
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
      order: 2,
    });
  });
});

describe("normalizeImage", () => {
  it("maps usage and rewrites the upload url", () => {
    const result = normalizeImage({
      id: 5,
      description: "cover",
      url: "http://localhost:3000/uploads/1/cover.png",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
      usage: { projects: [{ id: 2, title: "Portfolio" }], isProfilePicture: true },
    });

    expect(result.url).toBe("/api/uploads/file/1/cover.png");
    expect(result.usage).toEqual({
      projects: [{ id: 2, title: "Portfolio" }],
      isProfilePicture: true,
    });
  });

  it("defaults usage to empty when the backend omits it", () => {
    const result = normalizeImage({
      id: 6,
      description: null,
      url: "http://localhost:3000/uploads/1/x.png",
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
    });

    expect(result.usage).toEqual({ projects: [], isProfilePicture: false });
  });
});

describe("toBackendProjectInput", () => {
  it("maps form input and omits empty optional values", () => {
    expect(
      toBackendProjectInput({
        title: "Portfolio Manager",
        description: "CMS",
        categoryId: 3,
        technologyIds: [2],
        repositoryUrl: "",
        liveUrl: "",
        coverImageId: null,
      }),
    ).toEqual({
      title: "Portfolio Manager",
      description: "CMS",
      d_categoryId: 3,
      technologyIds: [2],
      repo_url: undefined,
      live_url: undefined,
      f_imagesId: undefined,
    });
  });
});
