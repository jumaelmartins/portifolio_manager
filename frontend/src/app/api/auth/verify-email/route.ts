import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import {
  clearVerificationContext,
  readVerificationContext,
} from "@/lib/auth/verification";

export async function POST(request: Request) {
  const context = await readVerificationContext();
  if (!context) {
    return NextResponse.json(
      { status: 400, message: "Verification session expired" },
      { status: 400 },
    );
  }

  const { code } = await request.json();
  const response = await backendFetch(
    "/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify({ token: context.token, code }),
    },
    false,
  );

  if (response.ok) {
    await clearVerificationContext();
  }

  return toBffResponse(response);
}
