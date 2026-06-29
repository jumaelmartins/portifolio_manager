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

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid education ID" }, { status: 400 });
}

export async function GET(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/education/${id}`);
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeEducation((await response.json()) as BackendEducation));
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = educationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid education data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/education/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendEducationInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeEducation((await response.json()) as BackendEducation), {
    status: response.status,
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/education/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
