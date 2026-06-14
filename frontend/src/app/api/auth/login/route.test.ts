// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, setSessionCookie } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/auth/session", () => ({ setSessionCookie }));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the access token and omits it from the login response", async () => {
    backendFetch.mockResolvedValue(
      Response.json({
        access_token: "jwt-token",
        message: "Login successful",
        user: { id: 7, email: "admin@email.com" },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@email.com",
          password: "StrongP@ss1",
        }),
      }),
    );

    expect(await response.json()).toEqual({
      message: "Login successful",
      user: { id: 7, email: "admin@email.com" },
    });
    expect(setSessionCookie).toHaveBeenCalledWith("jwt-token");
    expect(backendFetch).toHaveBeenCalledWith(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: "admin@email.com",
          password: "StrongP@ss1",
        }),
      },
      false,
    );
  });

  it("preserves an unverified-email error without storing a session", async () => {
    backendFetch.mockResolvedValue(
      Response.json(
        {
          message: "Email is not verified",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 401 },
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@email.com",
          password: "StrongP@ss1",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      status: 401,
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified",
    });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});
