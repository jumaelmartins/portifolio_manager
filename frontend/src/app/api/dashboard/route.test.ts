// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, clearSessionCookie } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/auth/session", () => ({ clearSessionCookie }));

import { GET } from "./route";

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates and normalizes the supported backend resources", async () => {
    backendFetch.mockImplementation((path: string) => {
      if (path === "/projects") {
        return Promise.resolve(
          Response.json([
            {
              id: 7,
              title: "Portfolio Manager",
              description: "Open-source portfolio CMS",
              category: { id: 2, category: "full stack" },
              f_images: {
                id: 9,
                url: "http://localhost:3000/uploads/7/cover.png",
              },
              updated_at: "2026-06-12T10:00:00.000Z",
            },
          ]),
        );
      }

      if (path === "/category") {
        return Promise.resolve(
          Response.json([{ id: 2, category: "full stack" }]),
        );
      }

      return Promise.resolve(
        Response.json([{ id: 3, tech: "typescript" }]),
      );
    });

    const response = await GET();

    expect(await response.json()).toEqual({
      metrics: {
        projects: 1,
        categories: 1,
        technologies: 1,
        withCover: 1,
        withoutCover: 0,
      },
      recentProjects: [
        {
          id: 7,
          title: "Portfolio Manager",
          description: "Open-source portfolio CMS",
          category: { id: 2, name: "full stack" },
          coverImage: {
            id: 9,
            url: "http://localhost:3000/uploads/7/cover.png",
          },
          updatedAt: "2026-06-12T10:00:00.000Z",
        },
      ],
    });
    expect(backendFetch).toHaveBeenCalledTimes(3);
    expect(backendFetch).toHaveBeenCalledWith("/projects");
    expect(backendFetch).toHaveBeenCalledWith("/category");
    expect(backendFetch).toHaveBeenCalledWith("/technologies");
  });

  it("preserves an upstream authentication error and clears the session", async () => {
    backendFetch.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/projects"
          ? Response.json(
              { message: "Session expired" },
              { status: 401 },
            )
          : Response.json([]),
      ),
    );

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      status: 401,
      message: "Session expired",
    });
    expect(clearSessionCookie).toHaveBeenCalledOnce();
  });
});
