import type { ApiError } from "@/lib/api/types";
import type { CourseEntry, CourseInput } from "../types";

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error: ApiError =
      payload && typeof payload === "object" && "message" in payload
        ? {
            ...(payload as ApiError),
            status: response.status,
          }
        : {
            status: response.status,
            message: "Request failed",
          };
    throw error;
  }

  return payload as T;
}

export function getCourses() {
  return requestJson<CourseEntry[]>("/api/courses");
}

export function getCourse(id: number) {
  return requestJson<CourseEntry>(`/api/courses/${id}`);
}

export function createCourse(input: CourseInput) {
  return requestJson<CourseEntry>("/api/courses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCourse(id: number, input: CourseInput) {
  return requestJson<CourseEntry>(`/api/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCourse(id: number) {
  return requestJson<{ id: number }>(`/api/courses/${id}`, {
    method: "DELETE",
  });
}
