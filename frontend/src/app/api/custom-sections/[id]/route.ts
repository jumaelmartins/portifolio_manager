import { NextResponse } from "next/server";
import { z } from "zod";

import { customSectionSchema } from "@/features/custom-sections/schemas";
import { toBackendSectionInput } from "@/features/custom-sections/server/normalize-custom-sections";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid section ID" }, { status: 400 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = customSectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toBackendSectionInput(parsed.data)),
    }),
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/custom-sections/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
