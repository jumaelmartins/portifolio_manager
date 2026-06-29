// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { DELETE, GET, PATCH } from "./route";

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

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/education/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects a non-integer ID", async () => {
    const response = await GET(new Request("http://localhost/api/education/abc"), ctx("abc"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("returns a normalized entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await GET(new Request("http://localhost/api/education/2"), ctx("2"));
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 2, institutionName: "MIT" }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/education/2");
  });

  it("validates and maps an update", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await PATCH(
      new Request("http://localhost/api/education/2", {
        method: "PATCH",
        body: JSON.stringify({
          title: "BSc Computer Science",
          institutionName: "MIT",
          startDate: "2018-09-01",
          endDate: "2022-06-30",
          current: false,
        }),
      }),
      ctx("2"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/education/2", {
      method: "PATCH",
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

  it("returns only the deleted entry ID", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await DELETE(
      new Request("http://localhost/api/education/2", { method: "DELETE" }),
      ctx("2"),
    );
    expect(await response.json()).toEqual({ id: 2 });
    expect(backendFetch).toHaveBeenCalledWith("/education/2", { method: "DELETE" });
  });

  it("passes through backend error for GET", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 404 }));
    const response = await GET(new Request("http://localhost/api/education/2"), ctx("2"));
    expect(response.status).toBe(404);
  });

  it("rejects invalid PATCH body with 400", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/education/2", {
        method: "PATCH",
        body: JSON.stringify({ title: "", institutionName: "MIT", startDate: "2018-09-01", current: false }),
      }),
      ctx("2"),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ status: 400, fieldErrors: expect.any(Object) }),
    );
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
