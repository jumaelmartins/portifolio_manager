import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDashboard } from "./use-dashboard";

describe("useDashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the aggregated dashboard contract from the BFF", async () => {
    const payload = {
      metrics: {
        projects: 1,
        categories: 1,
        technologies: 2,
        withCover: 1,
        withoutCover: 0,
      },
      recentProjects: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useDashboard(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard", {
      cache: "no-store",
    });
  });
});
