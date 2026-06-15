import { NextResponse } from "next/server";
import { z } from "zod";

import { projectSchema } from "@/features/projects/schemas";
import {
  normalizeProject,
  toBackendProjectInput,
} from "@/features/projects/server/normalize-project";
import type { BackendProject } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

async function readProjectId(context: ProjectRouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json(
    { status: 400, message: "Invalid project ID" },
    { status: 400 },
  );
}

export async function GET(_request: Request, context: ProjectRouteContext) {
  const id = await readProjectId(context);
  if (!id) {
    return invalidIdResponse();
  }

  const response = await backendFetch(`/projects/${id}`);
  if (!response.ok) {
    return toBffResponse(response);
  }

  return NextResponse.json(
    normalizeProject((await response.json()) as BackendProject),
    { status: response.status },
  );
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const id = await readProjectId(context);
  if (!id) {
    return invalidIdResponse();
  }

  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 400,
        message: "Invalid project data",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const response = await backendFetch(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendProjectInput(parsed.data)),
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  return NextResponse.json(
    normalizeProject((await response.json()) as BackendProject),
    { status: response.status },
  );
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const id = await readProjectId(context);
  if (!id) {
    return invalidIdResponse();
  }

  const response = await backendFetch(`/projects/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  return NextResponse.json({ id });
}
