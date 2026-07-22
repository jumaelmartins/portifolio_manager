import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useArchiveEducation, useEducations } from "./education-queries";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("education queries", () => {
  it("fetches archived state", async () => {
    renderHook(() => useEducations("archived"), { wrapper: wrapper() });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/education?state=archived",
        expect.anything(),
      ),
    );
  });

  it("archive hits the archive route", async () => {
    const { result } = renderHook(() => useArchiveEducation(), {
      wrapper: wrapper(),
    });
    result.current.mutate(7);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/education/7/archive",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});
