import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { isDataObject } from "@/features/custom-sections/server/is-data-object";

type RouteContext = { params: Promise<{ itemId: string }> };

async function readItemId(context: RouteContext) {
  const itemId = Number((await context.params).itemId);
  return Number.isInteger(itemId) && itemId > 0 ? itemId : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid item ID" }, { status: 400 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const itemId = await readItemId(context);
  if (!itemId) return invalidIdResponse();
  const body = await request.json().catch(() => null);
  if (!isDataObject(body)) {
    return NextResponse.json({ status: 400, message: "Item data is required" }, { status: 400 });
  }
  return toBffResponse(
    await backendFetch(`/custom-sections/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ data: body.data }),
    }),
  );
}

export async function DELETE(_req: Request, context: RouteContext) {
  const itemId = await readItemId(context);
  if (!itemId) return invalidIdResponse();
  const response = await backendFetch(`/custom-sections/items/${itemId}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id: itemId });
}
