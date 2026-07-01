import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { isDataObject } from "@/features/custom-sections/server/is-data-object";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ status: 400, message: "Invalid section ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!isDataObject(body)) {
    return NextResponse.json({ status: 400, message: "Item data is required" }, { status: 400 });
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/${id}/items`, {
      method: "POST",
      body: JSON.stringify({ data: body.data }),
    }),
  );
}
