import type { ApiError } from "@/lib/api/types";
import type { CategoryEntry, CategoryInput } from "../types";

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

export function getCategories() {
  return requestJson<CategoryEntry[]>("/api/categories");
}

export function getCategory(id: number) {
  return requestJson<CategoryEntry>(`/api/categories/${id}`);
}

export function createCategory(input: CategoryInput) {
  return requestJson<CategoryEntry>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: number, input: CategoryInput) {
  return requestJson<CategoryEntry>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: number) {
  return requestJson<{ id: number }>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}
