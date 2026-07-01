// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { normalizePortfolio } = vi.hoisted(() => ({ normalizePortfolio: vi.fn() }));
vi.mock("./normalize-portfolio", () => ({ normalizePortfolio }));

import { getPublicPortfolio } from "./get-portfolio";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPublicPortfolio", () => {
  it("fetches with the portfolio tag and revalidate window, then normalizes", async () => {
    normalizePortfolio.mockReturnValue({ id: 1 });
    fetchMock.mockResolvedValue(Response.json({ id: 1 }));

    const result = await getPublicPortfolio("1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/public/users/1"),
      { next: { tags: ["portfolio:1"], revalidate: 3600 } },
    );
    expect(normalizePortfolio).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual({ id: 1 });
  });

  it("returns null on a 404", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    expect(await getPublicPortfolio("999")).toBeNull();
    expect(normalizePortfolio).not.toHaveBeenCalled();
  });

  it("throws on a non-404 error", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(getPublicPortfolio("1")).rejects.toThrow();
  });
});
