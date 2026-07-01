import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  useCreateSection,
  useCreateItem,
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
