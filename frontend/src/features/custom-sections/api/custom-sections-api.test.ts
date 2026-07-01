import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson, fetchSections } from "./custom-sections-api";
import type { BackendCustomSection } from "../types";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns typed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: 1, name: "Skills" })),
    );

    await expect(
      requestJson<{ id: number; name: string }>("/api/custom-sections"),
    ).resolves.toEqual({ id: 1, name: "Skills" });
  });

  it("throws the BFF ApiError payload for non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            status: 404,
            code: "SECTION_NOT_FOUND",
            message: "Section not found",
          },
          { status: 404 },
        ),
      ),
    );

    await expect(requestJson("/api/custom-sections/99")).rejects.toEqual({
      status: 404,
      code: "SECTION_NOT_FOUND",
      message: "Section not found",
    });
  });
});

describe("fetchSections", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps the backend array through normalizeSection", async () => {
    const backendSection: BackendCustomSection = {
      id: 42,
      name: "Experience",
      description: "Work history",
      icon: null,
      field_schema: [{ key: "company", label: "Company", type: "text", required: true }],
      order: 1,
      user_id: 7,
      items: [
        {
          id: 10,
          section_id: 42,
          data: { company: "Acme" },
          order: 0,
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json([backendSection])),
    );

    const result = await fetchSections();

    expect(result).toHaveLength(1);
    const section = result[0];
    // snake_case normalized to camelCase
    expect(section.fieldSchema).toEqual([
      { key: "company", label: "Company", type: "text", required: true },
    ]);
    // nested items normalized
    expect(section.items).toHaveLength(1);
    expect(section.items[0].sectionId).toBe(42);
    expect(section.items[0].data).toEqual({ company: "Acme" });
  });
});
