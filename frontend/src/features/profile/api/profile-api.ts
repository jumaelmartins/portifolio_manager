// frontend/src/features/profile/api/profile-api.ts
import type { ApiError } from "@/lib/api/types";
import type { ProfileData, ProfileInput } from "../types";

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

export function fetchProfile(): Promise<ProfileData> {
  return requestJson<ProfileData>("/api/profile");
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  await requestJson("/api/profile", { method: "PUT", body: JSON.stringify(input) });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await requestJson("/api/profile/password", { method: "POST", body: JSON.stringify(input) });
}

export async function uploadProfilePicture(file: File): Promise<void> {
  const formData = new FormData();
  formData.set("file", file);
  const { image } = await requestJson<{ message: string; image: { id: number } }>("/api/uploads", {
    method: "POST",
    body: formData,
  });
  await updateProfile({ profilePictureId: image.id });
}
