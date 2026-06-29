// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { GET, POST } from "./route";

const backendEntry = {
  id: 1,
  tile: "Software Engineer",
  company_name: "Acme Corp",
  description: "Built things",
  start_date: "2022-01-01T00:00:00.000Z",
  end_date: "2024-06-30T00:00:00.000Z",
  current: false,
  created_at: "2022-01-01T00:00:00.000Z",
  updated_at: "2024-06-30T00:00:00.000Z",
};

describe("/api/experience", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("normalizes the experience collection", async () => {
    backendFetch.mockResolvedValue(Response.json([backendEntry]));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ id: 1, title: "Software Engineer", companyName: "Acme Corp" }),
    ]);
    expect(backendFetch).toHaveBeenCalledWith("/experience");
  });

  it("rejects invalid input before calling the backend", async () => {
    const response = await POST(
      new Request("http://localhost/api/experience", {
        method: "POST",
        body: JSON.stringify({ title: "", companyName: "Acme", description: "Work", startDate: "2022-01-01", current: false }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ status: 400, fieldErrors: expect.any(Object) }),
    );
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("maps valid input and normalizes the created entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry, { status: 201 }));
    const response = await POST(
      new Request("http://localhost/api/experience", {
        method: "POST",
        body: JSON.stringify({
          title: "Software Engineer",
          companyName: "Acme Corp",
          description: "Built things",
          startDate: "2022-01-01",
          endDate: "2024-06-30",
          current: false,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 1, title: "Software Engineer" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/experience", {
      method: "POST",
      body: JSON.stringify({
        tile: "Software Engineer",
        company_name: "Acme Corp",
        description: "Built things",
        start_date: "2022-01-01",
        end_date: "2024-06-30",
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
