import type { ApiError } from "@/lib/api/types";
import { normalizeSection } from "../server/normalize-custom-sections";
import type {
  BackendCustomSection,
  CustomItemInput,
  CustomSection,
  CustomSectionInput,
} from "../types";

export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(input, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error: ApiError =
      payload && typeof payload === "object" && "message" in payload
        ? { ...(payload as ApiError), status: response.status }
        : { status: response.status, message: "Request failed" };
    throw error;
  }
  return payload as T;
}

export async function fetchSections(): Promise<CustomSection[]> {
  const data = await requestJson<BackendCustomSection[]>("/api/custom-sections");
  return data.map(normalizeSection);
}

export async function createSection(input: CustomSectionInput): Promise<CustomSection> {
  const data = await requestJson<BackendCustomSection>("/api/custom-sections", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeSection(data);
}

export async function updateSection(id: number, input: CustomSectionInput): Promise<CustomSection> {
  const data = await requestJson<BackendCustomSection>(`/api/custom-sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return normalizeSection(data);
}

export function deleteSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}`, { method: "DELETE" });
}

export async function createItem(sectionId: number, input: CustomItemInput): Promise<void> {
  await requestJson(`/api/custom-sections/${sectionId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateItem(itemId: number, input: CustomItemInput): Promise<void> {
  await requestJson(`/api/custom-sections/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteItem(itemId: number): Promise<void> {
  await requestJson(`/api/custom-sections/items/${itemId}`, { method: "DELETE" });
}
