import { NextResponse } from "next/server";
import { z } from "zod";
import { courseSchema } from "@/features/courses/schemas";
import {
  normalizeCourse,
  toBackendCourseInput,
} from "@/features/courses/server/normalize-course";
import type { BackendCourse } from "@/features/courses/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidIdResponse() {
  return NextResponse.json({ status: 400, message: "Invalid course ID" }, { status: 400 });
}

export async function GET(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/courses/${id}`);
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeCourse((await response.json()) as BackendCourse));
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const parsed = courseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid course data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch(`/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toBackendCourseInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeCourse((await response.json()) as BackendCourse), {
    status: response.status,
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const id = await readId(context);
  if (!id) return invalidIdResponse();
  const response = await backendFetch(`/courses/${id}`, { method: "DELETE" });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json({ id });
}
