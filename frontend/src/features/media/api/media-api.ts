import {
  deleteImage,
  requestJson,
  uploadImage,
} from "@/features/projects/api/project-api";
import type { ImageOption } from "@/features/projects/types";
import type { MediaImage } from "../types";

export { deleteImage, uploadImage };

export function getMedia() {
  return requestJson<MediaImage[]>("/api/images");
}

export function updateImageDescription(
  id: number,
  description: string | null,
) {
  return requestJson<ImageOption>(`/api/images/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ description }),
  });
}
