import type { ApiError } from "@/lib/api/types";
import type { ContentState } from "@/lib/content-state";
import { normalizeItem, normalizeSection } from "../server/normalize-custom-sections";
import type {
  BackendCustomItem,
  BackendCustomSection,
  CustomItem,
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

export async function fetchSections(state: ContentState = "active"): Promise<CustomSection[]> {
  const suffix = state === "active" ? "" : `?state=${state}`;
  const data = await requestJson<BackendCustomSection[]>(`/api/custom-sections${suffix}`);
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

export function archiveSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}/archive`, { method: "PATCH" });
}

export function unarchiveSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}/unarchive`, { method: "PATCH" });
}

export function restoreSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}/restore`, { method: "PATCH" });
}

export function purgeSection(id: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/${id}/purge`, { method: "DELETE" });
}

export async function getSectionItems(
  sectionId: number,
  state: ContentState = "active",
): Promise<CustomItem[]> {
  const suffix = state === "active" ? "" : `?state=${state}`;
  const data = await requestJson<BackendCustomItem[]>(
    `/api/custom-sections/${sectionId}/items${suffix}`,
  );
  return data.map(normalizeItem);
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

export function archiveItem(itemId: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/items/${itemId}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveItem(itemId: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/items/${itemId}/unarchive`, {
    method: "PATCH",
  });
}

export function restoreItem(itemId: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/items/${itemId}/restore`, {
    method: "PATCH",
  });
}

export function purgeItem(itemId: number): Promise<{ id: number }> {
  return requestJson<{ id: number }>(`/api/custom-sections/items/${itemId}/purge`, {
    method: "DELETE",
  });
}

export function reorderSections(ids: number[]) {
  return requestJson<CustomSection[]>("/api/custom-sections/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export async function reorderItems(sectionId: number, ids: number[]): Promise<void> {
  await requestJson(`/api/custom-sections/${sectionId}/items/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}
