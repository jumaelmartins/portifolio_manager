import { NextResponse } from "next/server";
import { z } from "zod";
import { experienceSchema } from "@/features/experience/schemas";
import {
  normalizeExperience,
  toBackendExperienceInput,
} from "@/features/experience/server/normalize-experience";
import type { BackendExperience } from "@/features/experience/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  const response = await backendFetch("/experience");
  if (!response.ok) return toBffResponse(response);
  const items = (await response.json()) as BackendExperience[];
  return NextResponse.json(items.map(normalizeExperience));
}

export async function POST(request: Request) {
  const parsed = experienceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid experience data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch("/experience", {
    method: "POST",
    body: JSON.stringify(toBackendExperienceInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeExperience((await response.json()) as BackendExperience), {
    status: response.status,
  });
}
