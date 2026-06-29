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

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid experience ID" }, { status: 400 });
}

export async function GET(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/experience/${id}`);
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeExperience((await response.json()) as BackendExperience));
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = experienceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid experience data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/experience/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendExperienceInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeExperience((await response.json()) as BackendExperience), {
    status: response.status,
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/experience/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
