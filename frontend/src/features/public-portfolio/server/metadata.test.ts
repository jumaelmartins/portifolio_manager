import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPortfolioMetadata } from "./metadata";
import type { PublicPortfolio } from "../types";

function makePortfolio(overrides: Partial<PublicPortfolio> = {}): PublicPortfolio {
  return {
    id: 1,
    username: "jumael",
    role: "OWNER",
    avatarUrl: "/api/uploads/file/1/avatar.png",
    projects: [{ id: 1 } as PublicPortfolio["projects"][number]],
    experience: [],
    education: [],
    courses: [],
    customSections: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildPortfolioMetadata", () => {
  it("returns a not-found title when the portfolio is null", () => {
    expect(buildPortfolioMetadata(null, "999")).toEqual({ title: "Portfolio not found" });
  });

  it("builds title, description, openGraph, and twitter metadata", () => {
    const meta = buildPortfolioMetadata(makePortfolio(), "1");
    expect(meta.title).toBe("jumael — Portfolio");
    expect(meta.description).toBe("OWNER · 1 projects");
    expect(meta.openGraph).toMatchObject({
      type: "profile",
      url: "https://example.com/portfolio/1",
      images: ["https://example.com/api/uploads/file/1/avatar.png"],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to 'Portfolio' and empty images when username/avatar are null", () => {
    const meta = buildPortfolioMetadata(makePortfolio({ username: null, avatarUrl: null }), "1");
    expect(meta.title).toBe("Portfolio — Portfolio");
    expect(meta.openGraph).toMatchObject({ images: [] });
  });
});
