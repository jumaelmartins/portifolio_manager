// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

const { revalidatePortfolio } = vi.hoisted(() => ({ revalidatePortfolio: vi.fn() }));
vi.mock("@/lib/api/revalidate", () => ({ revalidatePortfolio }));

import { DELETE, GET, PATCH } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/technologies/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-integer ID", async () => {
    const response = await GET(new Request("http://localhost/api/technologies/nope"), ctx("nope"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("returns a normalized technology", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 5, tech: "Docker" }));
    const response = await GET(new Request("http://localhost/api/technologies/5"), ctx("5"));
    expect(await response.json()).toEqual({ id: 5, name: "Docker" });
    expect(backendFetch).toHaveBeenCalledWith("/technologies/5");
  });

  it("validates and maps an update, then revalidates", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 5, tech: "Docker" }));
    const response = await PATCH(
      new Request("http://localhost/api/technologies/5", {
        method: "PATCH",
        body: JSON.stringify({ name: "Docker" }),
      }),
      ctx("5"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/technologies/5", {
      method: "PATCH",
      body: JSON.stringify({ tech: "Docker" }),
    });
    expect(revalidatePortfolio).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid PATCH body with 400", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/technologies/5", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
      }),
      ctx("5"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("returns only the deleted technology ID and revalidates", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 5, tech: "Docker" }));
    const response = await DELETE(
      new Request("http://localhost/api/technologies/5", { method: "DELETE" }),
      ctx("5"),
    );
    expect(await response.json()).toEqual({ id: 5 });
    expect(backendFetch).toHaveBeenCalledWith("/technologies/5", { method: "DELETE" });
    expect(revalidatePortfolio).toHaveBeenCalledTimes(1);
  });

  it("passes through backend error for DELETE without revalidating", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 403 }));
    const response = await DELETE(
      new Request("http://localhost/api/technologies/5", { method: "DELETE" }),
      ctx("5"),
    );
    expect(response.status).toBe(403);
    expect(revalidatePortfolio).not.toHaveBeenCalled();
  });
});
