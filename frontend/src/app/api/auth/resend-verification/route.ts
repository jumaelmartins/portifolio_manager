import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { normalizeApiError } from "@/lib/api/errors";
import { setVerificationContext } from "@/lib/auth/verification";

export async function POST(request: Request) {
  const { email } = await request.json();
  const response = await backendFetch(
    "/auth/resend-verification",
    { method: "POST", body: JSON.stringify({ email }) },
    false,
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(normalizeApiError(response.status, payload), {
      status: response.status,
    });
  }

  await setVerificationContext({
    token: payload.verification.token,
    email,
  });

  return NextResponse.json({
    message: payload.message,
    email,
    expiresInSeconds: payload.verification.expiresInSeconds,
  });
}
