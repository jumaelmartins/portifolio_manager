// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const backendEntry = {
  id: 2,
  title: "BSc Computer Science",
  institution_name: "MIT",
  description: null,
  start_date: "2018-09-01T00:00:00.000Z",
  end_date: "2022-06-30T00:00:00.000Z",
  current: false,
  created_at: "2018-09-01T00:00:00.000Z",
  updated_at: "2022-06-30T00:00:00.000Z",
};

describe("/api/education", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("normalizes the education collection", async () => {
    backendFetch.mockResolvedValue(Response.json([backendEntry]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ id: 2, title: "BSc Computer Science", institutionName: "MIT" }),
    ]);
    expect(backendFetch).toHaveBeenCalledWith("/education");
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/education", {
        method: "POST",
        body: JSON.stringify({ title: "", institutionName: "MIT", startDate: "2018-09-01", current: false }),
      }),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("maps valid input and normalizes the created entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry, { status: 201 }));
    const response = await POST(
      new Request("http://localhost/api/education", {
        method: "POST",
        body: JSON.stringify({
          title: "BSc Computer Science",
          institutionName: "MIT",
          startDate: "2018-09-01",
          endDate: "2022-06-30",
          current: false,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 2, title: "BSc Computer Science", institutionName: "MIT" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/education", {
      method: "POST",
      body: JSON.stringify({
        title: "BSc Computer Science",
        institution_name: "MIT",
        description: undefined,
        start_date: "2018-09-01",
        end_date: "2022-06-30",
        current: false,
      }),
    });
  });

  it("passes through backend error responses", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 500 }));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
