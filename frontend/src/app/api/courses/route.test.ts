// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const backendEntry = {
  id: 3,
  title: "Machine Learning Fundamentals",
  institution_name: "Coursera",
  description: null,
  start_date: "2023-01-15T00:00:00.000Z",
  end_date: "2023-04-30T00:00:00.000Z",
  current: false,
  created_at: "2023-01-15T00:00:00.000Z",
  updated_at: "2023-04-30T00:00:00.000Z",
};

describe("/api/courses", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("normalizes the courses collection", async () => {
    backendFetch.mockResolvedValue(Response.json([backendEntry]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ id: 3, title: "Machine Learning Fundamentals", institutionName: "Coursera" }),
    ]);
    expect(backendFetch).toHaveBeenCalledWith("/courses");
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/courses", {
        method: "POST",
        body: JSON.stringify({ title: "", institutionName: "Coursera", startDate: "2023-01-15", current: false }),
      }),
    );
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("maps valid input and normalizes the created entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry, { status: 201 }));
    const response = await POST(
      new Request("http://localhost/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Machine Learning Fundamentals",
          institutionName: "Coursera",
          startDate: "2023-01-15",
          endDate: "2023-04-30",
          current: false,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 3, title: "Machine Learning Fundamentals" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/courses", {
      method: "POST",
      body: JSON.stringify({
        title: "Machine Learning Fundamentals",
        institution_name: "Coursera",
        description: undefined,
        start_date: "2023-01-15",
        end_date: "2023-04-30",
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
