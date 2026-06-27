import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { OAUTH_STATE_COOKIE } from "@/lib/auth/cookies";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = form.get("token");
  const state = form.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (
    typeof token !== "string" ||
    typeof state !== "string" ||
    !expectedState ||
    state !== expectedState
  ) {
    return NextResponse.json(
      { status: 400, message: "Invalid OAuth handoff" },
      { status: 400 },
    );
  }

  await setSessionCookie(token);
  cookieStore.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return NextResponse.redirect(new URL("/dashboard", appUrl), 303);
}
