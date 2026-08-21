import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeImage } from "@/features/projects/server/normalize-project";
import type { BackendImage } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

const descriptionSchema = z.object({
  description: z.string().max(200).nullable().optional(),
});

type ImageRouteContext = { params: Promise<{ id: string }> };

async function readId(context: ImageRouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: ImageRouteContext) {
  const id = await readId(context);
  if (!id) {
    return NextResponse.json(
      { status: 400, message: "Invalid image ID" },
      { status: 400 },
    );
  }

  const parsed = descriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid image data" },
      { status: 400 },
    );
  }

  const response = await backendFetch(`/images/${id}`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  await revalidatePortfolio();
  return NextResponse.json(
    normalizeImage((await response.json()) as BackendImage),
    { status: response.status },
  );
}
