import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useCreateItem, useUpdateItem, useDeleteItem, useReorderItems } = vi.hoisted(() => ({
  useCreateItem: vi.fn(),
  useUpdateItem: vi.fn(),
  useDeleteItem: vi.fn(),
  useReorderItems: vi.fn(),
}));

vi.mock("../api/custom-sections-queries", () => ({
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
}));

import type { CustomSection } from "../types";
import { ItemsDrawer } from "./items-drawer";

const section: CustomSection = {
  id: 1,
  name: "Skills",
  description: null,
  icon: null,
  fieldSchema: [{ key: "name", label: "Name", type: "text" }],
  order: 1,
  items: [
    { id: 1, sectionId: 1, data: { name: "TypeScript" }, order: 1 },
    { id: 2, sectionId: 1, data: { name: "JavaScript" }, order: 2 },
  ],
};

describe("ItemsDrawer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useCreateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useDeleteItem.mockReturnValue({ mutateAsync: vi.fn() });
    useReorderItems.mockReturnValue({ mutate: vi.fn() });
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("renders a reorder handle per item and keeps edit/delete actions", () => {
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    expect(screen.getAllByRole("button", { name: /^Reorder / }).length).toBe(2);
    expect(screen.getAllByRole("button", { name: "Edit item" }).length).toBe(2);
    expect(screen.getAllByRole("button", { name: "Delete item" }).length).toBe(2);
  });
});
