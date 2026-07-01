// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, clearSessionCookie } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  clearSessionCookie: vi.fn(),
}));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/auth/session", () => ({ clearSessionCookie }));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/profile/password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/profile/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing current password", async () => {
    const response = await post({ newPassword: "NewPass1!" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects a missing new password", async () => {
    const response = await post({ currentPassword: "OldPass1!" });
    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards with backend field names", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await post({ currentPassword: "OldPass1!", newPassword: "NewPass1!" });
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: "OldPass1!", new_password: "NewPass1!" }),
    });
  });

  it("passes through a backend error", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await post({ currentPassword: "wrong", newPassword: "NewPass1!" });
    expect(response.status).toBe(401);
  });
});
