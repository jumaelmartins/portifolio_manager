// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { PATCH, DELETE } from "./route";

function ctx(itemId: string) {
  return { params: Promise.resolve({ itemId }) };
}

describe("/api/custom-sections/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid itemId on PATCH", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/custom-sections/items/abc", {
        method: "PATCH",
        body: JSON.stringify({ data: { title: "X" } }),
      }),
      ctx("abc"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid item update", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await PATCH(
      new Request("http://localhost/api/custom-sections/items/10", {
        method: "PATCH",
        body: JSON.stringify({ data: { title: "Updated" } }),
      }),
      ctx("10"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/items/10", {
      method: "PATCH",
      body: JSON.stringify({ data: { title: "Updated" } }),
    });
  });

  it("rejects an invalid itemId on DELETE", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/custom-sections/items/0", { method: "DELETE" }),
      ctx("0"),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a delete", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await DELETE(
      new Request("http://localhost/api/custom-sections/items/11", { method: "DELETE" }),
      ctx("11"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 11 });
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/items/11", { method: "DELETE" });
  });
});
