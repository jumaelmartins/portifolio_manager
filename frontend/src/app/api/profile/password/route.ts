import { NextResponse } from "next/server";
import { z } from "zod";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const passwordBffSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = passwordBffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  return toBffResponse(
    await backendFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: parsed.data.currentPassword,
        new_password: parsed.data.newPassword,
      }),
    }),
  );
}
