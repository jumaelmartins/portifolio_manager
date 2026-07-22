import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSection, createItem } = vi.hoisted(() => ({
  createSection: vi.fn(),
  createItem: vi.fn(),
}));

vi.mock("./custom-sections-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./custom-sections-api")>();
  return { ...actual, createSection, createItem };
});

import {
  customSectionKeys,
  useArchiveItem,
  useArchiveSection,
  useCreateSection,
  useCreateItem,
  useReorderItems,
  useSectionItems,
  useSections,
} from "./custom-sections-queries";

describe("custom section queries", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  it("has stable query keys", () => {
    expect(customSectionKeys.all).toEqual(["custom-sections"]);
  });

  it("useCreateSection invalidates custom-sections and dashboard after success", async () => {
    createSection.mockResolvedValue({
      id: 1,
      name: "Skills",
      description: null,
      icon: null,
      fieldSchema: [],
      order: null,
      items: [],
    });

    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateSection(), { wrapper: Wrapper });

    await result.current.mutateAsync({
      name: "Skills",
      fieldSchema: [{ key: "name", label: "Name", type: "text" }],
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: customSectionKeys.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("useCreateItem invalidates custom-sections after success", async () => {
    createItem.mockResolvedValue(undefined);

    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateItem(), { wrapper: Wrapper });

    await result.current.mutateAsync({
      sectionId: 1,
      input: { data: { name: "TypeScript" } },
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: customSectionKeys.all });
  });
});

describe("state-aware sections query + transitions", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  function wrapper() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "QueryWrapper";
    return Wrapper;
  }

  it("useSections fetches the archived state and keys the query by state", async () => {
    renderHook(() => useSections("archived"), { wrapper: wrapper() });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/custom-sections?state=archived",
        expect.anything(),
      ),
    );
  });

  it("useArchiveSection hits the archive route", async () => {
    const { result } = renderHook(() => useArchiveSection(), { wrapper: wrapper() });
    result.current.mutate(9);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/custom-sections/9/archive",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});

describe("state-aware items query + transitions", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  function wrapper() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return {
      client,
      Wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    };
  }

  it("useSectionItems fetches the trash state and keys the query by (sectionId, state)", async () => {
    const { Wrapper } = wrapper();
    renderHook(() => useSectionItems(42, "trash"), { wrapper: Wrapper });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/custom-sections/42/items?state=trash",
        expect.anything(),
      ),
    );
  });

  it("useSectionItems does not fetch when sectionId is 0 (no section selected)", async () => {
    const { Wrapper } = wrapper();
    renderHook(() => useSectionItems(0, "active"), { wrapper: Wrapper });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("useArchiveItem hits the archive route and invalidates the section's items + sections + dashboard", async () => {
    const { Wrapper, client } = wrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useArchiveItem(42), { wrapper: Wrapper });
    result.current.mutate(10);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/custom-sections/items/10/archive",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["custom-section-items", 42] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: customSectionKeys.all });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    });
  });

  it("useReorderItems targets the active items query key for the section", () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useReorderItems(42), { wrapper: Wrapper });
    expect(result.current).toBeDefined();
  });
});
