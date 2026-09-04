import { NextResponse } from "next/server";
import { z } from "zod";

import {
  normalizeProject,
} from "@/features/projects/server/normalize-project";
import type { BackendProject } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";
import { revalidatePortfolio } from "@/lib/api/revalidate";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

const featuredSchema = z.object({ featured: z.boolean() });

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { status: 400, message: "Invalid project ID" },
      { status: 400 },
    );
  }

  const parsed = featuredSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 400,
        message: "Invalid featured flag",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const response = await backendFetch(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ featured: parsed.data.featured }),
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  await revalidatePortfolio();
  return NextResponse.json(
    normalizeProject((await response.json()) as BackendProject),
    { status: response.status },
  );
}
