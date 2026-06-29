// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { DELETE, GET, PATCH } from "./route";

const backendEntry = {
  id: 5,
  tile: "Software Engineer",
  company_name: "Acme Corp",
  description: "Built things",
  start_date: "2022-01-01T00:00:00.000Z",
  end_date: null,
  current: true,
  created_at: "2022-01-01T00:00:00.000Z",
  updated_at: "2022-01-01T00:00:00.000Z",
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/experience/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects a non-integer ID", async () => {
    const response = await GET(new Request("http://localhost/api/experience/nope"), ctx("nope"));
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("returns a normalized entry", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await GET(new Request("http://localhost/api/experience/5"), ctx("5"));
    expect(await response.json()).toEqual(
      expect.objectContaining({ id: 5, title: "Software Engineer", current: true, endDate: null }),
    );
    expect(backendFetch).toHaveBeenCalledWith("/experience/5");
  });

  it("validates and maps an update", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await PATCH(
      new Request("http://localhost/api/experience/5", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Software Engineer",
          companyName: "Acme Corp",
          description: "Built things",
          startDate: "2022-01-01",
          current: true,
        }),
      }),
      ctx("5"),
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/experience/5", {
      method: "PATCH",
      body: JSON.stringify({
        tile: "Software Engineer",
        company_name: "Acme Corp",
        description: "Built things",
        start_date: "2022-01-01",
        end_date: undefined,
        current: true,
      }),
    });
  });

  it("returns only the deleted entry ID", async () => {
    backendFetch.mockResolvedValue(Response.json(backendEntry));
    const response = await DELETE(
      new Request("http://localhost/api/experience/5", { method: "DELETE" }),
      ctx("5"),
    );
    expect(await response.json()).toEqual({ id: 5 });
    expect(backendFetch).toHaveBeenCalledWith("/experience/5", { method: "DELETE" });
  });
});
