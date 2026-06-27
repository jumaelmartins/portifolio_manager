import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await backendFetch(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify(body) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  return NextResponse.json({ message: payload.message });
}
