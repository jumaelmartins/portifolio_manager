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

export async function GET() {
  const response = await backendFetch("/courses");
  if (!response.ok) return toBffResponse(response);
  const items = (await response.json()) as BackendCourse[];
  return NextResponse.json(items.map(normalizeCourse));
}

export async function POST(request: Request) {
  const parsed = courseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Invalid course data", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const response = await backendFetch("/courses", {
    method: "POST",
    body: JSON.stringify(toBackendCourseInput(parsed.data)),
  });
  if (!response.ok) return toBffResponse(response);
  return NextResponse.json(normalizeCourse((await response.json()) as BackendCourse), {
    status: response.status,
  });
}
