// frontend/src/app/api/custom-sections/[id]/items/reorder/route.ts
import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type RouteContext = { params: Promise<{ id: string }> };

function readIds(body: unknown): number[] | null {
  const ids = (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  if (!ids.every((id) => Number.isInteger(id))) return null;
  return ids as number[];
}

export async function PATCH(request: Request, context: RouteContext) {
  const sectionId = Number((await context.params).id);
  if (!Number.isInteger(sectionId) || sectionId <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid section ID" },
      { status: 400 },
    );
  }
  const ids = readIds(await request.json().catch(() => null));
  if (!ids) {
    return NextResponse.json(
      { status: 400, message: "ids must be a non-empty array of integers" },
      { status: 400 },
    );
  }
  const response = await backendFetch(
    `/custom-sections/${sectionId}/items/reorder`,
    { method: "PATCH", body: JSON.stringify({ ids }) },
  );
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return toBffResponse(response);
}
