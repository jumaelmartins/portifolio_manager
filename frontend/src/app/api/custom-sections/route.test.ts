// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const validBody = {
  name: "Awards",
  fieldSchema: [{ key: "title", label: "Title", type: "text", required: true }],
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/custom-sections", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/custom-sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the section list through from the backend", async () => {
    backendFetch.mockResolvedValue(Response.json([{ id: 1, name: "Awards" }]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1, name: "Awards" }]);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections");
  });

  it("rejects a section without a name", async () => {
    const response = await post({ ...validBody, name: "" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a section with an empty fieldSchema", async () => {
    const response = await post({ ...validBody, fieldSchema: [] });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards a valid section with backend field names", async () => {
    backendFetch.mockResolvedValue(Response.json({ id: 9 }, { status: 201 }));
    const response = await post(validBody);
    expect(response.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledWith("/custom-sections", {
      method: "POST",
      body: JSON.stringify({
        name: "Awards",
        field_schema: [{ key: "title", label: "Title", type: "text", required: true }],
        description: undefined,
        icon: undefined,
      }),
    });
  });

  it("passes through a backend error", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 500 }));
    const response = await post(validBody);
    expect(response.status).toBe(500);
  });
});
