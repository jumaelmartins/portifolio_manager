import { NextResponse } from "next/server";

import { normalizeImage } from "@/features/projects/server/normalize-project";
import type { BackendImage } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
]);

type BackendUploadResponse = {
  message: string;
  image: BackendImage;
};

export async function POST(request: Request) {
  const input = await request.formData();
  const file = input.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { status: 400, message: "Image file is required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        status: 415,
        message: "Only JPEG, PNG, and GIF images are supported",
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { status: 413, message: "Image must be 5 MB or smaller" },
      { status: 413 },
    );
  }

  const sessionResponse = await backendFetch("/auth/me");
  if (!sessionResponse.ok) {
    return toBffResponse(sessionResponse);
  }

  const user = (await sessionResponse.json()) as { id: number };
  const upload = new FormData();
  upload.set("file", file, file.name);

  const uploadResponse = await backendFetch(`/upload/users/${user.id}`, {
    method: "POST",
    body: upload,
  });
  if (!uploadResponse.ok) {
    return toBffResponse(uploadResponse);
  }

  const payload = (await uploadResponse.json()) as BackendUploadResponse;
  return NextResponse.json(
    {
      message: payload.message,
      image: normalizeImage(payload.image),
    },
    { status: uploadResponse.status },
  );
}
