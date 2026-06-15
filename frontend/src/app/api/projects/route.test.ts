// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const backendProject = {
  id: 1,
  title: "Portfolio Manager",
  description: "CMS",
  repo_url: "https://github.com/example/repo",
  live_url: null,
  d_categoryId: 3,
  f_imagesId: null,
  category: { id: 3, category: "Full Stack" },
  technologies: [{ id: 2, tech: "TypeScript" }],
  f_images: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-12T00:00:00.000Z",
};

describe("/api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the project collection", async () => {
    backendFetch.mockResolvedValue(Response.json([backendProject]));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: 1,
        repositoryUrl: "https://github.com/example/repo",
        category: { id: 3, name: "Full Stack" },
      }),
    ]);
    expect(backendFetch).toHaveBeenCalledWith("/projects");
  });

  it("rejects invalid project input before calling the backend", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "Portfolio Manager",
          description: "CMS",
          categoryId: 3,
          technologyIds: [2],
          repositoryUrl: "github.com/example/repo",
          liveUrl: "",
          coverImageId: null,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        status: 400,
        fieldErrors: expect.objectContaining({
          repositoryUrl: expect.any(Array),
        }),
      }),
    );
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("maps valid input and normalizes the created project", async () => {
    backendFetch.mockResolvedValue(
      Response.json(backendProject, { status: 201 }),
    );

    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "Portfolio Manager",
          description: "CMS",
          categoryId: 3,
          technologyIds: [2],
          repositoryUrl: "https://github.com/example/repo",
          liveUrl: "",
          coverImageId: null,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        id: 1,
        repositoryUrl: "https://github.com/example/repo",
      }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/projects", {
      method: "POST",
      body: JSON.stringify({
        title: "Portfolio Manager",
        description: "CMS",
        d_categoryId: 3,
        technologyIds: [2],
        repo_url: "https://github.com/example/repo",
        live_url: undefined,
        f_imagesId: undefined,
      }),
    });
  });
});
