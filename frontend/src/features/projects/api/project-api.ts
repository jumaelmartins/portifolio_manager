import type { ApiError } from "@/lib/api/types";
import type { ContentState } from "@/lib/content-state";
import type {
  CategoryOption,
  ImageOption,
  Project,
  ProjectInput,
  TechnologyOption,
} from "../types";

export type UploadImageResult = {
  message: string;
  image: ImageOption;
};

export async function requestJson<T>(
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

export function getProjects(state: ContentState = "active") {
  const suffix = state === "active" ? "" : `?state=${state}`;
  return requestJson<Project[]>(`/api/projects${suffix}`);
}

export function getProject(id: number) {
  return requestJson<Project>(`/api/projects/${id}`);
}

export function createProject(input: ProjectInput) {
  return requestJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(id: number, input: ProjectInput) {
  return requestJson<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: number) {
  return requestJson<{ id: number }>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}

export function reorderProjects(ids: number[]) {
  return requestJson<Project[]>("/api/projects/reorder", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export function archiveProject(id: number) {
  return requestJson<{ id: number }>(`/api/projects/${id}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveProject(id: number) {
  return requestJson<{ id: number }>(`/api/projects/${id}/unarchive`, {
    method: "PATCH",
  });
}

export function restoreProject(id: number) {
  return requestJson<{ id: number }>(`/api/projects/${id}/restore`, {
    method: "PATCH",
  });
}

export function purgeProject(id: number) {
  return requestJson<{ id: number }>(`/api/projects/${id}/purge`, {
    method: "DELETE",
  });
}

export function getCategories() {
  return requestJson<CategoryOption[]>("/api/categories");
}

export function getTechnologies() {
  return requestJson<TechnologyOption[]>("/api/technologies");
}

export function getImages() {
  return requestJson<ImageOption[]>("/api/images");
}

export function uploadImage(file: File) {
  const body = new FormData();
  body.set("file", file);

  return requestJson<UploadImageResult>("/api/uploads", {
    method: "POST",
    body,
  });
}

export function deleteImage(imageId: number) {
  return requestJson<{ id: number }>(`/api/uploads/${imageId}`, {
    method: "DELETE",
  });
}
