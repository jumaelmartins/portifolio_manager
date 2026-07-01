import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson, uploadProfilePicture } from "./profile-api";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns typed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: 1, email: "user@example.com" })),
    );

    await expect(
      requestJson<{ id: number; email: string }>("/api/profile"),
    ).resolves.toEqual({ id: 1, email: "user@example.com" });
  });

  it("throws the BFF ApiError payload for non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
          { status: 401 },
        ),
      ),
    );

    await expect(requestJson("/api/profile")).rejects.toEqual({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });
});

describe("uploadProfilePicture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts FormData to /api/uploads then updates profile with profilePictureId", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: "ok", image: { id: 12 } }))
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["content"], "avatar.png", { type: "image/png" });
    await uploadProfilePicture(file);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    // First call: POST to /api/uploads with FormData containing the file
    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstUrl).toBe("/api/uploads");
    expect(firstInit.body).toBeInstanceOf(FormData);
    expect((firstInit.body as FormData).get("file")).toBe(file);

    // Second call: PUT /api/profile with profilePictureId from the upload response
    const [secondUrl, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondUrl).toBe("/api/profile");
    expect(secondInit.method).toBe("PUT");
    expect(JSON.parse(secondInit.body as string)).toEqual({ profilePictureId: 12 });
  });
});
