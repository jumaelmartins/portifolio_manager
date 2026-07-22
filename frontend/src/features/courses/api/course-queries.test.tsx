import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useArchiveCourse, useCourses } from "./course-queries";

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

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("course queries", () => {
  it("fetches archived state", async () => {
    renderHook(() => useCourses("archived"), { wrapper: wrapper() });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/courses?state=archived",
        expect.anything(),
      ),
    );
  });

  it("archive hits the archive route", async () => {
    const { result } = renderHook(() => useArchiveCourse(), {
      wrapper: wrapper(),
    });
    result.current.mutate(7);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/courses/7/archive",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});
