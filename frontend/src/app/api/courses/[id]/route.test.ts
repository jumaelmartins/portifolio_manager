// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { DELETE, GET, PATCH } from "./route";

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

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/courses/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects a non-integer ID", async () => {
    const response = await GET(new Request("http://localhost/api/courses/abc"), ctx("abc"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("returns a normalized entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await GET(new Request("http://localhost/api/courses/3"), ctx("3"));
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 3, title: "Machine Learning Fundamentals", institutionName: "Coursera" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/courses/3");
  });

  it("validates and maps an update", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await PATCH(
      new Request("http://localhost/api/courses/3", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Machine Learning Fundamentals",
          institutionName: "Coursera",
          startDate: "2023-01-15",
          endDate: "2023-04-30",
          current: false,
        }),
      }),
      ctx("3"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/courses/3", {
      method: "PATCH",
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

  it("returns only the deleted entry ID", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await DELETE(
      new Request("http://localhost/api/courses/3", { method: "DELETE" }),
      ctx("3"),
    );
    expect(await response.json()).toEqual({ id: 3 });
    expect(backendFetch).toHaveBeenCalledWith("/courses/3", { method: "DELETE" });
  });

  it("passes through backend error for GET", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 404 }));
    const response = await GET(new Request("http://localhost/api/courses/3"), ctx("3"));
    expect(response.status).toBe(404);
  });

  it("rejects invalid PATCH body with 400", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/courses/3", {
        method: "PATCH",
        body: JSON.stringify({ title: "", institutionName: "Amazon", startDate: "2023-03-01", current: false }),
      }),
      ctx("3"),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ status: 400, fieldErrors: expect.any(Object) }),
    );
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
