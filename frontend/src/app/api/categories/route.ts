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

export async function GET() {
  const response = await backendFetch("/category");
  if (!response.ok) return toBffResponse(response);
  const items = (await response.json()) as BackendCategory[];
  return NextResponse.json(items.map(normalizeCategory));
}

export async function POST(request: Request) {
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
  const response = await backendFetch("/category", {
    method: "POST",
    body: JSON.stringify(toBackendCategoryInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json(
    normalizeCategory((await response.json()) as BackendCategory),
    { status: response.status },
  );
}
