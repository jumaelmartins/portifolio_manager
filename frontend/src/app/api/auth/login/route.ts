import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const credentials = await request.json();
  const response = await backendFetch(
    "/auth/login",
    { method: "POST", body: JSON.stringify(credentials) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  await setSessionCookie(payload.access_token);
  return NextResponse.json({
    message: payload.message,
    user: payload.user,
  });
}
