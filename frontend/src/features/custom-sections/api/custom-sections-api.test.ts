import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveItem,
  archiveSection,
  fetchSections,
  getSectionItems,
  purgeItem,
  purgeSection,
  requestJson,
} from "./custom-sections-api";
import type { BackendCustomItem, BackendCustomSection } from "../types";

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

  it("appends ?state= for non-active states", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSections("trash");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections?state=trash",
      expect.anything(),
    );
  });

  it("omits the state query param for the active state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSections("active");

    expect(fetchMock).toHaveBeenCalledWith("/api/custom-sections", expect.anything());
  });
});

describe("section transitions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("archiveSection hits the archive route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 5 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(archiveSection(5)).resolves.toEqual({ id: 5 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections/5/archive",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("purgeSection hits the purge route with DELETE", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 5 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(purgeSection(5)).resolves.toEqual({ id: 5 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections/5/purge",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("getSectionItems", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps the raw backend items array through normalizeItem", async () => {
    const backendItem: BackendCustomItem = {
      id: 10,
      section_id: 42,
      data: { company: "Acme" },
      order: 0,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([backendItem])));

    const result = await getSectionItems(42);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 10,
      sectionId: 42,
      data: { company: "Acme" },
      order: 0,
    });
  });

  it("appends ?state= for non-active states", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await getSectionItems(42, "trash");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections/42/items?state=trash",
      expect.anything(),
    );
  });

  it("omits the state query param for the active state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await getSectionItems(42, "active");

    expect(fetchMock).toHaveBeenCalledWith("/api/custom-sections/42/items", expect.anything());
  });
});

describe("item transitions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("archiveItem hits the archive route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(archiveItem(10)).resolves.toEqual({ id: 10 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections/items/10/archive",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("purgeItem hits the purge route with DELETE", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(purgeItem(10)).resolves.toEqual({ id: 10 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/custom-sections/items/10/purge",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
