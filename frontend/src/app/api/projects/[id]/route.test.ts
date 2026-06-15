// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { DELETE, GET, PATCH } from "./route";

const backendProject = {
  id: 7,
  title: "Portfolio Manager",
  description: "CMS",
  repo_url: null,
  live_url: null,
  d_categoryId: 3,
  f_imagesId: null,
  category: { id: 3, category: "Full Stack" },
  technologies: [{ id: 2, tech: "TypeScript" }],
  f_images: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-12T00:00:00.000Z",
};

const context = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe("/api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-positive integer ID", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects/nope"),
      context("nope"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: 400,
      message: "Invalid project ID",
    });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("normalizes a project detail", async () => {
    backendFetch.mockResolvedValue(Response.json(backendProject));

    const response = await GET(
      new Request("http://localhost/api/projects/7"),
      context("7"),
    );

    expect(await response.json()).toEqual(
      expect.objectContaining({
        id: 7,
        category: { id: 3, name: "Full Stack" },
      }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/projects/7");
  });

  it("validates and maps a project update", async () => {
    backendFetch.mockResolvedValue(Response.json(backendProject));

    const response = await PATCH(
      new Request("http://localhost/api/projects/7", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Portfolio Manager",
          description: "CMS",
          categoryId: 3,
          technologyIds: [2],
          repositoryUrl: "",
          liveUrl: "",
          coverImageId: null,
        }),
      }),
      context("7"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 7, title: "Portfolio Manager" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/projects/7", {
      method: "PATCH",
      body: JSON.stringify({
        title: "Portfolio Manager",
        description: "CMS",
        d_categoryId: 3,
        technologyIds: [2],
        repo_url: undefined,
        live_url: undefined,
        f_imagesId: undefined,
      }),
    });
  });

  it("returns only the deleted project ID", async () => {
    backendFetch.mockResolvedValue(Response.json(backendProject));

    const response = await DELETE(
      new Request("http://localhost/api/projects/7", { method: "DELETE" }),
      context("7"),
    );

    expect(await response.json()).toEqual({ id: 7 });
    expect(backendFetch).toHaveBeenCalledWith("/projects/7", {
      method: "DELETE",
    });
  });
});
