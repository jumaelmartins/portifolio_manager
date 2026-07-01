// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, clearSessionCookie } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  clearSessionCookie: vi.fn(),
}));
vi.mock("@/lib/api/backend", () => ({ backendFetch }));
vi.mock("@/lib/auth/session", () => ({ clearSessionCookie }));

import { GET, PUT } from "./route";

const me = {
  id: 7,
  email: "user@example.com",
  username: "jumael",
  images: [],
  f_profile_picture: null,
};

function put(body: unknown) {
  return PUT(
    new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify(body) }),
  );
}

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the current user on GET", async () => {
    backendFetch.mockResolvedValue(Response.json(me));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 7,
      email: "user@example.com",
      username: "jumael",
      profilePicture: null,
    });
    expect(backendFetch).toHaveBeenCalledWith("/auth/me");
  });

  it("passes through a backend error from GET /auth/me on PUT", async () => {
    backendFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const response = await put({ email: "new@example.com" });
    expect(response.status).toBe(401);
  });

  it("rejects an invalid email on PUT", async () => {
    backendFetch.mockResolvedValueOnce(Response.json({ id: 7 }));
    const response = await put({ email: "not-an-email" });
    expect(response.status).toBe(400);
  });

  it("forwards a valid update with backend field names", async () => {
    backendFetch
      .mockResolvedValueOnce(Response.json({ id: 7 }))
      .mockResolvedValueOnce(Response.json({ id: 7 }));
    const response = await put({ username: "newname", profilePictureId: 12 });
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenLastCalledWith("/users/7", {
      method: "PUT",
      body: JSON.stringify({ username: "newname", f_profile_pictureId: 12 }),
    });
  });
});
