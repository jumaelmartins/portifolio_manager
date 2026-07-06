import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

import { reorderByIds } from "./reorder-by-ids";
import { useReorder } from "./use-reorder";

type Row = { id: number; order: number };
const KEY = ["rows"] as const;
const initial: Row[] = [
  { id: 1, order: 0 },
  { id: 2, order: 1 },
  { id: 3, order: 2 },
];

describe("useReorder", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData<Row[]>(KEY, initial);
  });

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  function render(mutationFn: (ids: number[]) => Promise<unknown>) {
    return renderHook(
      () =>
        useReorder<Row[]>({
          queryKey: KEY,
          mutationFn,
          applyOptimistic: (data, ids) => reorderByIds(data, ids),
        }),
      { wrapper },
    );
  }

  it("applies the optimistic order immediately on mutate", async () => {
    const mutationFn = vi.fn().mockResolvedValue([]);
    const { result } = render(mutationFn);

    result.current.mutate([3, 1, 2]);

    await waitFor(() =>
      expect(queryClient.getQueryData<Row[]>(KEY)).toEqual([
        { id: 3, order: 0 },
        { id: 1, order: 1 },
        { id: 2, order: 2 },
      ]),
    );
    expect(mutationFn).toHaveBeenCalledWith([3, 1, 2]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("rolls back and shows a toast on failure", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = render(mutationFn);

    result.current.mutate([3, 1, 2]);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Row[]>(KEY)).toEqual(initial);
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
