// @vitest-environment node

import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { sessionCookieOptions, sessionMaxAge } from "./session";

describe("sessionCookieOptions", () => {
  it("uses HttpOnly, SameSite Lax, and root path", () => {
    expect(sessionCookieOptions(false, 3600)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 3600,
    });
  });

  it("aligns cookie lifetime with the JWT expiration", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(new TextEncoder().encode("test-secret"));

    expect(sessionMaxAge(token, now)).toBe(3600);
  });
});
