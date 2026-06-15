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

export async function GET() {
  const response = await backendFetch("/projects");
  if (!response.ok) {
    return toBffResponse(response);
  }

  const projects = (await response.json()) as BackendProject[];
  return NextResponse.json(projects.map(normalizeProject));
}

export async function POST(request: Request) {
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

  const response = await backendFetch("/projects", {
    method: "POST",
    body: JSON.stringify(toBackendProjectInput(parsed.data)),
  });
  if (!response.ok) {
    return toBffResponse(response);
  }

  const project = (await response.json()) as BackendProject;
  return NextResponse.json(normalizeProject(project), {
    status: response.status,
  });
}
