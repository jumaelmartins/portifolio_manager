import "server-only";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./cookies";

// Matches backend UserRoles.SYSADMIN (see backend/src/utils/types.ts).
// The JWT `role` claim is the numeric role id serialized as a string.
export const SYSADMIN_ROLE = "1";

export function roleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const role = decodeJwt(token).role;
  return role == null ? null : String(role);
}

export async function getSessionRole(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return roleFromToken(token);
}

export function userIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const sub = decodeJwt(token).sub;
  return sub == null ? null : String(sub);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userIdFromToken(token);
}

export function sessionMaxAge(
  token: string,
  now = Math.floor(Date.now() / 1000),
) {
  const expiration = decodeJwt(token).exp;
  return expiration ? Math.max(0, expiration - now) : 60 * 60;
}

export function sessionCookieOptions(production: boolean, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    maxAge,
  };
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(
      process.env.NODE_ENV === "production",
      sessionMaxAge(token),
    ),
  );
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(process.env.NODE_ENV === "production", 0),
    maxAge: 0,
  });
}
