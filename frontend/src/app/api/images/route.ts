import { NextResponse } from "next/server";

import { normalizeImage } from "@/features/projects/server/normalize-project";
import type { BackendImage } from "@/features/projects/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

export async function GET() {
  const response = await backendFetch("/images");
  if (!response.ok) {
    return toBffResponse(response);
  }

  const images = (await response.json()) as BackendImage[];
  return NextResponse.json(images.map(normalizeImage));
}
