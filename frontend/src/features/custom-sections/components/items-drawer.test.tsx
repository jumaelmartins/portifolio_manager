import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  useSectionItems,
  useArchiveItem,
  useUnarchiveItem,
  useRestoreItem,
  usePurgeItem,
} = vi.hoisted(() => ({
  useCreateItem: vi.fn(),
  useUpdateItem: vi.fn(),
  useDeleteItem: vi.fn(),
  useReorderItems: vi.fn(),
  useSectionItems: vi.fn(),
  useArchiveItem: vi.fn(),
  useUnarchiveItem: vi.fn(),
  useRestoreItem: vi.fn(),
  usePurgeItem: vi.fn(),
}));

vi.mock("../api/custom-sections-queries", () => ({
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  useSectionItems,
  useArchiveItem,
  useUnarchiveItem,
  useRestoreItem,
  usePurgeItem,
}));

import type { CustomItem, CustomSection } from "../types";
import { ItemsDrawer } from "./items-drawer";

const section: CustomSection = {
  id: 1,
  name: "Skills",
  description: null,
  icon: null,
  fieldSchema: [{ key: "name", label: "Name", type: "text" }],
  order: 1,
  items: [],
};

const activeItems: CustomItem[] = [
  { id: 1, sectionId: 1, data: { name: "TypeScript" }, order: 1 },
  { id: 2, sectionId: 1, data: { name: "JavaScript" }, order: 2 },
];

const trashedItems: CustomItem[] = [
  { id: 3, sectionId: 1, data: { name: "COBOL" }, order: 1 },
];

describe("ItemsDrawer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useCreateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateItem.mockReturnValue({ mutateAsync: vi.fn() });
    useDeleteItem.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() });
    useReorderItems.mockReturnValue({ mutate: vi.fn() });
    useArchiveItem.mockReturnValue({ mutate: vi.fn() });
    useUnarchiveItem.mockReturnValue({ mutate: vi.fn() });
    useRestoreItem.mockReturnValue({ mutate: vi.fn() });
    usePurgeItem.mockReturnValue({ mutateAsync: vi.fn() });
    useSectionItems.mockImplementation((_sectionId: number, state = "active") => ({
      data: state === "trash" ? trashedItems : activeItems,
      isPending: false,
      error: null,
    }));
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("renders a reorder handle per item and an edit + move-to-trash action per item (active, default)", () => {
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    expect(useSectionItems).toHaveBeenCalledWith(1, "active");
    expect(screen.getAllByRole("button", { name: /^Reorder /}).length).toBe(2);
    expect(screen.getAllByRole("button", { name: /^Edit /}).length).toBe(2);
    expect(screen.getAllByRole("button", { name: /to trash$/ }).length).toBe(2);
  });

  it("renders a StateFilter tablist", () => {
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole("tablist", { name: "Content state" })).toBeInTheDocument();
  });

  it("clicking the Trash tab fetches the trash state, hides reorder handles, and shows Restore + Delete…permanently", async () => {
    const user = userEvent.setup();
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    await user.click(screen.getByRole("tab", { name: "Trash" }));

    expect(useSectionItems).toHaveBeenCalledWith(1, "trash");
    expect(screen.queryByRole("button", { name: /^Reorder /})).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Edit /})).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Restore /}).length).toBe(1);
    expect(screen.getAllByRole("button", { name: /permanently$/ }).length).toBe(1);
  });

  it("in Trash, clicking Delete…permanently opens a confirm dialog and confirming calls usePurgeItem", async () => {
    const user = userEvent.setup();
    const purge = { mutateAsync: vi.fn(async () => ({ id: 3 })) };
    usePurgeItem.mockReturnValue(purge);
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    await user.click(screen.getByRole("tab", { name: "Trash" }));
    await user.click(screen.getByRole("button", { name: /permanently$/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete item" }));
    expect(purge.mutateAsync).toHaveBeenCalledWith(3);
  });

  it("in Active, clicking the move-to-trash action calls useDeleteItem directly with no dialog", async () => {
    const user = userEvent.setup();
    const del = { mutate: vi.fn(), mutateAsync: vi.fn() };
    useDeleteItem.mockReturnValue(del);
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    const [firstTrashButton] = screen.getAllByRole("button", { name: /to trash$/ });
    await user.click(firstTrashButton);

    expect(del.mutate).toHaveBeenCalledWith(1);
    expect(screen.queryByText("Delete this item?")).not.toBeInTheDocument();
  });

  it("in Active, clicking Archive calls useArchiveItem", async () => {
    const user = userEvent.setup();
    const archive = { mutate: vi.fn() };
    useArchiveItem.mockReturnValue(archive);
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    const [firstArchiveButton] = screen.getAllByRole("button", { name: /^Archive /});
    await user.click(firstArchiveButton);

    expect(archive.mutate).toHaveBeenCalledWith(1);
    expect(useArchiveItem).toHaveBeenCalledWith(1);
  });

  it("reorder (SortableList) only renders in Active", async () => {
    const user = userEvent.setup();
    render(<ItemsDrawer section={section} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    expect(screen.getAllByRole("button", { name: /^Reorder /}).length).toBe(2);

    await user.click(screen.getByRole("tab", { name: "Trash" }));
    expect(screen.queryByRole("button", { name: /^Reorder /})).not.toBeInTheDocument();
  });
});
