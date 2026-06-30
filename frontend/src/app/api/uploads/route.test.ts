// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
}));

vi.mock("@/lib/api/backend", () => ({ backendFetch }));

import { POST } from "./route";

function uploadRequest(file: File) {
  const form = new FormData();
  form.set("file", file);
  return new Request("http://localhost/api/uploads", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported file types before calling the backend", async () => {
    const response = await POST(
      uploadRequest(new File(["plain text"], "notes.txt", { type: "text/plain" })),
    );

    expect(response.status).toBe(415);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects images larger than 5 MB", async () => {
    const response = await POST(
      uploadRequest(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    );

    expect(response.status).toBe(413);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("resolves the current user and forwards a valid image", async () => {
    backendFetch
      .mockResolvedValueOnce(Response.json({ id: 7, email: "user@email.com" }))
      .mockResolvedValueOnce(
        Response.json(
          {
            message: "Successfully upload!",
            image: {
              id: 9,
              description: null,
              url: "http://localhost:3000/uploads/7/cover.png",
              created_at: "2026-06-01T00:00:00.000Z",
              updated_at: "2026-06-01T00:00:00.000Z",
            },
          },
          { status: 201 },
        ),
      );

    const response = await POST(
      uploadRequest(
        new File([new Uint8Array([137, 80, 78, 71])], "cover.png", {
          type: "image/png",
        }),
      ),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "Successfully upload!",
      image: {
        id: 9,
        description: null,
        url: "/api/uploads/file/7/cover.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    });
    expect(backendFetch).toHaveBeenNthCalledWith(1, "/auth/me");
    expect(backendFetch).toHaveBeenNthCalledWith(
      2,
      "/upload/users/7",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
  });
});
