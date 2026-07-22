import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid project ID" },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/projects/${id}/restore`, {
    method: "PATCH",
  });
  if (!response.ok) return toBffResponse(response);
  await revalidatePortfolio();
  return NextResponse.json({ id });
}
