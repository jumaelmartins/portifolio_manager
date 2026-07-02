import { NextResponse } from "next/server";
import { z } from "zod";

import { technologySchema } from "@/features/technologies/schemas";
import {
  normalizeTechnology,
  toBackendTechnologyInput,
} from "@/features/technologies/server/normalize-technology";
import type { BackendTechnology } from "@/features/technologies/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json(
    { status: 400, message: "Invalid technology ID" },
    { status: 400 },
  );
}

export async function GET(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/technologies/${id}`);
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(
    normalizeTechnology((await response.json()) as BackendTechnology),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = technologySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 400,
        message: "Invalid technology data",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/technologies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendTechnologyInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json(
    normalizeTechnology((await response.json()) as BackendTechnology),
    { status: response.status },
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/technologies/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json({ id });
}
