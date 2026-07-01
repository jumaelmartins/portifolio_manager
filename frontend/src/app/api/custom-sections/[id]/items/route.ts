import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

function isDataObject(value: unknown): value is { data: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { data: unknown }).data === "object" &&
    (value as { data: unknown }).data !== null &&
    !Array.isArray((value as { data: unknown }).data)
  );
}

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
