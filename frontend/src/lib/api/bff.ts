import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/session";
import { normalizeApiError } from "./errors";

export async function toBffResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      await clearSessionCookie();
    }

    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  return NextResponse.json(payload, { status: response.status });
}
