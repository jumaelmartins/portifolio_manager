import { NextResponse } from "next/server";
import { z } from "zod";

import { customSectionSchema } from "@/features/custom-sections/schemas";
import { toBackendSectionInput } from "@/features/custom-sections/server/normalize-custom-sections";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

export async function GET() {
  return toBffResponse(await backendFetch("/custom-sections"));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = customSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch("/custom-sections", {
    method: "POST",
    body: JSON.stringify(toBackendSectionInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return toBffResponse(response);
}
