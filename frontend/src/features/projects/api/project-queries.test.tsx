import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateProject, uploadImage } = vi.hoisted(() => ({
  updateProject: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("./project-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./project-api")>();
  return { ...actual, updateProject, uploadImage };
});

import {
  projectKeys,
  useUpdateProject,
  useUploadImage,
} from "./project-queries";

describe("project queries", () => {
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

  it("uses stable query keys", () => {
    expect(projectKeys).toEqual(
      expect.objectContaining({
        all: ["projects"],
        categories: ["categories"],
        technologies: ["technologies"],
        images: ["images"],
      }),
    );
    expect(projectKeys.detail(7)).toEqual(["projects", 7]);
  });

  it("invalidates list, detail, and dashboard after an update", async () => {
    updateProject.mockResolvedValue({ id: 7 });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({
      id: 7,
      input: {
        title: "Portfolio",
        description: "CMS",
        categoryId: 1,
        technologyIds: [],
        coverImageId: null,
      },
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: projectKeys.all });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: projectKeys.detail(7),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("invalidates images after an upload", async () => {
    uploadImage.mockResolvedValue({ image: { id: 9 } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadImage(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync(
      new File(["image"], "cover.png", { type: "image/png" }),
    );

    expect(invalidate).toHaveBeenCalledWith({ queryKey: projectKeys.images });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});
