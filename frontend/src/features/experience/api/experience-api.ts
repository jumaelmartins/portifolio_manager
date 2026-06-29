import type { ApiError } from "@/lib/api/types";
import type { ExperienceEntry, ExperienceInput } from "../types";

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

export function getExperiences() {
  return requestJson<ExperienceEntry[]>("/api/experience");
}

export function getExperience(id: number) {
  return requestJson<ExperienceEntry>(`/api/experience/${id}`);
}

export function createExperience(input: ExperienceInput) {
  return requestJson<ExperienceEntry>("/api/experience", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateExperience(id: number, input: ExperienceInput) {
  return requestJson<ExperienceEntry>(`/api/experience/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteExperience(id: number) {
  return requestJson<{ id: number }>(`/api/experience/${id}`, {
    method: "DELETE",
  });
}
