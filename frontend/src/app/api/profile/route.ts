import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeProfile } from "@/features/profile/server/normalize-profile";
import type { BackendProfileData } from "@/features/profile/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

const profileUpdateBffSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  profilePictureId: z.number().int().positive().optional(),
});

export async function GET() {
  const res = await backendFetch("/auth/me");
  if (!res.ok) return toBffResponse(res);
  const user = (await res.json()) as BackendProfileData;
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  return NextResponse.json(normalizeProfile(user, backendUrl));
}

export async function PUT(request: Request) {
  const meRes = await backendFetch("/auth/me");
  if (!meRes.ok) return toBffResponse(meRes);
  const me = (await meRes.json()) as { id: number };

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateBffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 400, message: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const backendBody: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) backendBody.username = parsed.data.username;
  if (parsed.data.email !== undefined) backendBody.email = parsed.data.email;
  if (parsed.data.profilePictureId !== undefined) {
    backendBody.f_profile_pictureId = parsed.data.profilePictureId;
  }

  return toBffResponse(
    await backendFetch(`/users/${me.id}`, { method: "PUT", body: JSON.stringify(backendBody) }),
  );
}
