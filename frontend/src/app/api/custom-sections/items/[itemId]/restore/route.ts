import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
  const id = Number((await context.params).itemId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid item ID" },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/custom-sections/items/${id}/restore`, {
    method: "PATCH",
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json({ id });
}
