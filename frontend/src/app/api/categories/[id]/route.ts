import { NextResponse } from "next/server";
import { z } from "zod";

import { categorySchema } from "@/features/categories/schemas";
import {
  normalizeCategory,
  toBackendCategoryInput,
} from "@/features/categories/server/normalize-category";
import type { BackendCategory } from "@/features/categories/types";
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
    { status: 400, message: "Invalid category ID" },
    { status: 400 },
  );
}

export async function GET(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/category/${id}`);
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(
    normalizeCategory((await response.json()) as BackendCategory),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 400,
        message: "Invalid category data",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/category/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendCategoryInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json(
    normalizeCategory((await response.json()) as BackendCategory),
    { status: response.status },
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/category/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json({ id });
}
