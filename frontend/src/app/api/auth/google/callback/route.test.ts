// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, cookies, setSessionCookie } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
  cookies: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/lib/auth/session", () => ({ setSessionCookie }));

import { POST } from "./route";

function callbackRequest(state: string) {
  const form = new FormData();
  form.set("token", "jwt-token");
  form.set("state", state);

  return new Request("http://localhost/api/auth/google/callback", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/auth/google/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookies.mockResolvedValue(cookieStore);
    cookieStore.get.mockReturnValue({ value: "expected-state" });
  });

  it("rejects a mismatched OAuth state", async () => {
    const response = await POST(callbackRequest("wrong-state"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: 400,
      message: "Invalid OAuth handoff",
    });
    expect(setSessionCookie).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("stores the session, clears OAuth state, and redirects", async () => {
    const response = await POST(callbackRequest("expected-state"));

    expect(setSessionCookie).toHaveBeenCalledWith("jwt-token");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "pm_oauth_state",
      "",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3001/dashboard",
    );
  });
});
