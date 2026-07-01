// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { POST } from "./route";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/custom-sections/${id}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

describe("/api/custom-sections/[id]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid section id", async () => {
    const response = await post("abc", { data: { title: "X" } });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a body without a data object", async () => {
    const response = await post("1", { data: null });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid item", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 10 }, { status: 201 }));
    const response = await post("1", { data: { title: "Best Dev" } });
    expect(response.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/1/items", {
      method: "POST",
      body: JSON.stringify({ data: { title: "Best Dev" } }),
    });
  });
});
