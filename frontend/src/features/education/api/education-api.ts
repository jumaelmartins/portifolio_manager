import type { ApiError } from "@/lib/api/types";
import type { EducationEntry, EducationInput } from "../types";

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

export function getEducations() {
  return requestJson<EducationEntry[]>("/api/education");
}

export function getEducation(id: number) {
  return requestJson<EducationEntry>(`/api/education/${id}`);
}

export function createEducation(input: EducationInput) {
  return requestJson<EducationEntry>("/api/education", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEducation(id: number, input: EducationInput) {
  return requestJson<EducationEntry>(`/api/education/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEducation(id: number) {
  return requestJson<{ id: number }>(`/api/education/${id}`, {
    method: "DELETE",
  });
}
