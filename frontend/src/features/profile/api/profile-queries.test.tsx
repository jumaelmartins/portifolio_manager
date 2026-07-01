import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateProfile, uploadProfilePicture } = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  uploadProfilePicture: vi.fn(),
}));

vi.mock("./profile-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./profile-api")>();
  return { ...actual, updateProfile, uploadProfilePicture };
});

import {
  profileKeys,
  useUpdateProfile,
  useUploadProfilePicture,
} from "./profile-queries";

describe("profile queries", () => {
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

  it("profileKeys.me equals ['profile']", () => {
    expect(profileKeys.me).toEqual(["profile"]);
  });

  it("useUpdateProfile invalidates profile and session after success", async () => {
    updateProfile.mockResolvedValue(undefined);

    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper });

    await result.current.mutateAsync({ username: "newname" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["session"] });
  });

  it("useUploadProfilePicture invalidates profile and session after success", async () => {
    uploadProfilePicture.mockResolvedValue(undefined);

    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadProfilePicture(), { wrapper: Wrapper });

    const file = new File(["content"], "avatar.png", { type: "image/png" });
    await result.current.mutateAsync(file);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["session"] });
  });
});
