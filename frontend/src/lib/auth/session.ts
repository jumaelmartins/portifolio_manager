import "server-only";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./cookies";

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
