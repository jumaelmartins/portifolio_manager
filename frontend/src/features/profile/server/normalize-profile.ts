import { basename } from "path";

import { rewriteUploadUrl } from "@/features/projects/server/normalize-project";
import type { BackendProfileData, ProfileData } from "../types";

// backendUrl: the internal base URL of the NestJS backend (process.env.BACKEND_URL),
// injected by the BFF route so this function stays pure and testable.
export function normalizeProfile(user: BackendProfileData, backendUrl: string): ProfileData {
  let profilePicture: { id: number; url: string } | null = null;

  if (user.f_profile_picture) {
    const image = user.images.find((img) => img.id === user.f_profile_picture!.f_imagesId);
    if (image) {
      const fileName = basename(image.src_path.replace(/\\/g, "/"));
      const rawUrl = `${backendUrl}/uploads/${image.f_userId}/${fileName}`;
      profilePicture = { id: image.id, url: rewriteUploadUrl(rawUrl) };
    }
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    profilePicture,
  };
}
