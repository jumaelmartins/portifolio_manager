import type { ApiError } from "@/lib/api/types";
import type { TechnologyEntry, TechnologyInput } from "../types";

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

export function getTechnologies() {
  return requestJson<TechnologyEntry[]>("/api/technologies");
}

export function getTechnology(id: number) {
  return requestJson<TechnologyEntry>(`/api/technologies/${id}`);
}

export function createTechnology(input: TechnologyInput) {
  return requestJson<TechnologyEntry>("/api/technologies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTechnology(id: number, input: TechnologyInput) {
  return requestJson<TechnologyEntry>(`/api/technologies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTechnology(id: number) {
  return requestJson<{ id: number }>(`/api/technologies/${id}`, {
    method: "DELETE",
  });
}
