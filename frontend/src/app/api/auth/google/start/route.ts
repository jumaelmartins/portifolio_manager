import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { OAUTH_STATE_COOKIE } from "@/lib/auth/cookies";

export async function GET() {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  return NextResponse.redirect(
    `${backendUrl}/auth/google?state=${encodeURIComponent(state)}`,
  );
}
