// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET as getCategories } from "./categories/route";
import { GET as getImages } from "./images/route";
import { GET as getTechnologies } from "./technologies/route";

describe("project lookup BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes categories", async () => {
    backendFetch.mockResolvedValue(
      Response.json([{ id: 1, category: "Full Stack" }]),
    );

    const response = await getCategories();

    expect(await response.json()).toEqual([{ id: 1, name: "Full Stack" }]);
    expect(backendFetch).toHaveBeenCalledWith("/category");
  });

  it("normalizes technologies", async () => {
    backendFetch.mockResolvedValue(
      Response.json([{ id: 2, tech: "TypeScript" }]),
    );

    const response = await getTechnologies();

    expect(await response.json()).toEqual([{ id: 2, name: "TypeScript" }]);
    expect(backendFetch).toHaveBeenCalledWith("/technologies");
  });

  it("normalizes image timestamps", async () => {
    backendFetch.mockResolvedValue(
      Response.json([
        {
          id: 9,
          description: null,
          url: "http://localhost:3000/uploads/7/cover.png",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-12T00:00:00.000Z",
        },
      ]),
    );

    const response = await getImages();

    expect(await response.json()).toEqual([
      {
        id: 9,
        description: null,
        url: "/api/uploads/file/7/cover.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ]);
    expect(backendFetch).toHaveBeenCalledWith("/images");
  });
});
