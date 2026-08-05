import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type ApiKeyRouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  _request: Request,
  context: ApiKeyRouteContext,
) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const response = await backendFetch(`/api-keys/${id}`, { method: "DELETE" });
  if (!response.ok) {
    return toBffResponse(response);
  }
  return NextResponse.json({ id });
}
