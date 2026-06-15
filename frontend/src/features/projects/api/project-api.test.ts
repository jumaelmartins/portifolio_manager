import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "./project-api";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns typed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: 7, title: "Portfolio" })),
    );

    await expect(
      requestJson<{ id: number; title: string }>("/api/projects/7"),
    ).resolves.toEqual({ id: 7, title: "Portfolio" });
  });

  it("throws the BFF ApiError payload for non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            status: 409,
            code: "PROJECT_EXISTS",
            message: "Project already exists",
          },
          { status: 409 },
        ),
      ),
    );

    await expect(requestJson("/api/projects")).rejects.toEqual({
      status: 409,
      code: "PROJECT_EXISTS",
      message: "Project already exists",
    });
  });
});
