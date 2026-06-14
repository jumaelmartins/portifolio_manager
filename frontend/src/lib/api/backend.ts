import "server-only";

import { cookies } from "next/headers";

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  authenticated = true,
) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  if (authenticated) {
    const token = (await cookies()).get(
      process.env.SESSION_COOKIE_NAME ?? "pm_session",
    )?.value;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  return fetch(`${process.env.BACKEND_URL ?? "http://localhost:3000"}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
