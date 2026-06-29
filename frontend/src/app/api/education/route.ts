import { NextResponse } from "next/server";
import { z } from "zod";
import { educationSchema } from "@/features/education/schemas";
import {
  normalizeEducation,
  toBackendEducationInput,
} from "@/features/education/server/normalize-education";
import type { BackendEducation } from "@/features/education/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  const response = await backendFetch("/education");
  if (!response.ok) return toBffResponse(response);
  const items = (await response.json()) as BackendEducation[];
  return NextResponse.json(items.map(normalizeEducation));
}

export async function POST(request: Request) {
  const parsed = educationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid education data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch("/education", {
    method: "POST",
    body: JSON.stringify(toBackendEducationInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeEducation((await response.json()) as BackendEducation), {
    status: response.status,
  });
}
