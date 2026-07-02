// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

const { revalidatePortfolio } = vi.hoisted(() => ({ revalidatePortfolio: vi.fn() }));
vi.mock("@/lib/api/revalidate", () => ({ revalidatePortfolio }));

import { GET, POST } from "./route";

describe("/api/technologies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the technology collection", async () => {
    backendFetch.mockResolvedValue(Response.json([{ id: 1, tech: "TypeScript" }]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1, name: "TypeScript" }]);
    expect(backendFetch).toHaveBeenCalledWith("/technologies");
  });

  it("rejects invalid input before calling the backend", async () => {
    const response = await POST(
      new Request("http://localhost/api/technologies", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ status: 400, fieldErrors: expect.any(Object) }),
    );
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("maps valid input and normalizes the created technology", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 4, tech: "Prisma" }, { status: 201 }));
    const response = await POST(
      new Request("http://localhost/api/technologies", {
        method: "POST",
        body: JSON.stringify({ name: "Prisma" }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 4, name: "Prisma" });
    expect(backendFetch).toHaveBeenCalledWith("/technologies", {
      method: "POST",
      body: JSON.stringify({ tech: "Prisma" }),
    });
    expect(revalidatePortfolio).toHaveBeenCalledTimes(1);
  });

  it("does not revalidate when the backend write fails", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 500 }));
    await POST(
      new Request("http://localhost/api/technologies", {
        method: "POST",
        body: JSON.stringify({ name: "Prisma" }),
      }),
    );
    expect(revalidatePortfolio).not.toHaveBeenCalled();
  });

  it("passes through backend error responses", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 500 }));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
