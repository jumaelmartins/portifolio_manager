// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { PATCH, DELETE } from "./route";

const validBody = {
  name: "Awards",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/custom-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

describe("/api/custom-sections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid id on PATCH", async () => {
    const response = await patch("abc", validBody);
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects invalid data on PATCH", async () => {
    const response = await patch("3", { ...validBody, name: "" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid update", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 3 }));
    const response = await patch("3", validBody);
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/3", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Awards",
        field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
        description: undefined,
        icon: undefined,
      }),
    });
  });

  it("rejects an invalid id on DELETE", async () => {
    const response = await DELETE(new Request("http://localhost/api/custom-sections/0", { method: "DELETE" }), ctx("0"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a delete", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await DELETE(new Request("http://localhost/api/custom-sections/4", { method: "DELETE" }), ctx("4"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 4 });
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections/4", { method: "DELETE" });
  });
});
