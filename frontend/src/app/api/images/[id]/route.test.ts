import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, revalidatePortfolio } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  revalidatePortfolio: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/api/revalidate", () => ({ revalidatePortfolio }));

import { PATCH } from "./route";

const context = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/images/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards the description and normalizes the response", async () => {
    backendFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 5,
          description: "New",
          url: "http://localhost:3000/uploads/1/a.png",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );

    const response = await PATCH(
      new Request("http://x/api/images/5", {
        method: "PATCH",
        body: JSON.stringify({ description: "New" }),
      }),
      context("5"),
    );
    const body = await response.json();

    expect(backendFetch).toHaveBeenCalledWith("/images/5", {
      method: "PATCH",
      body: JSON.stringify({ description: "New" }),
    });
    expect(body.url).toBe("/api/uploads/file/1/a.png");
    expect(revalidatePortfolio).toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    const response = await PATCH(
      new Request("http://x/api/images/abc", { method: "PATCH" }),
      context("abc"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a description over 200 chars", async () => {
    const response = await PATCH(
      new Request("http://x/api/images/5", {
        method: "PATCH",
        body: JSON.stringify({ description: "a".repeat(201) }),
      }),
      context("5"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
