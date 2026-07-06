// frontend/src/app/api/custom-sections/reorder/route.ts
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";
import { normalizeSection } from "@/features/custom-sections/server/normalize-custom-sections";
import type { BackendCustomSection } from "@/features/custom-sections/types";

function readIds(body: unknown): number[] | null {
  const ids = (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  if (!ids.every((id) => Number.isInteger(id))) return null;
  return ids as number[];
}

export async function PATCH(request: Request) {
  const ids = readIds(await request.json().catch(() => null));
  if (!ids) {
    return NextResponse.json(
      { status: 400, message: "ids must be a non-empty array of integers" },
      { status: 400 },
    );
  }
  const response = await backendFetch("/custom-sections/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  const items = (await response.json()) as BackendCustomSection[];
  return NextResponse.json(items.map(normalizeSection));
}
