import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./errors";

describe("normalizeApiError", () => {
  it("preserves backend status, code, and message", () => {
    expect(
      normalizeApiError(401, {
        message: "Email is not verified",
        code: "EMAIL_NOT_VERIFIED",
      }),
    ).toEqual({
      status: 401,
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified",
    });
  });

  it("uses a stable fallback for unknown payloads", () => {
    expect(normalizeApiError(500, null)).toEqual({
      status: 500,
      message: "Unexpected server error",
    });
  });
});
