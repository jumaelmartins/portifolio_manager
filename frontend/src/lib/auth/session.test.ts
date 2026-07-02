// @vitest-environment node

import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  roleFromToken,
  sessionCookieOptions,
  sessionMaxAge,
  SYSADMIN_ROLE,
} from "./session";

async function signWithRole(role: unknown) {
  return new SignJWT({ sub: "7", role, status: "2" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode("test-secret"));
}

describe("roleFromToken", () => {
  it("returns null when no token is provided", () => {
    expect(roleFromToken(undefined)).toBeNull();
  });

  it("extracts the admin role claim as a string", async () => {
    const token = await signWithRole(1);
    expect(roleFromToken(token)).toBe(SYSADMIN_ROLE);
  });

  it("extracts a regular role claim as a string", async () => {
    const token = await signWithRole("2");
    expect(roleFromToken(token)).toBe("2");
  });
});

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
