import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const imageId = Number(id);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid image ID" },
      { status: 400 },
    );
  }

  const response = await backendFetch(`/upload/${imageId}`, {
    method: "DELETE",
  });
  return toBffResponse(response);
}
