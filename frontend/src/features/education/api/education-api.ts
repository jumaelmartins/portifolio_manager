import type { ApiError } from "@/lib/api/types";
import type { ContentState } from "@/lib/content-state";
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

export function getEducations(state: ContentState = "active") {
  const suffix = state === "active" ? "" : `?state=${state}`;
  return requestJson<EducationEntry[]>(`/api/education${suffix}`);
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

export function reorderEducations(ids: number[]) {
  return requestJson<EducationEntry[]>("/api/education/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export function archiveEducation(id: number) {
  return requestJson<{ id: number }>(`/api/education/${id}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveEducation(id: number) {
  return requestJson<{ id: number }>(`/api/education/${id}/unarchive`, {
    method: "PATCH",
  });
}

export function restoreEducation(id: number) {
  return requestJson<{ id: number }>(`/api/education/${id}/restore`, {
    method: "PATCH",
  });
}

export function purgeEducation(id: number) {
  return requestJson<{ id: number }>(`/api/education/${id}/purge`, {
    method: "DELETE",
  });
}
