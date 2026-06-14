import { NextResponse } from "next/server";

import { setVerificationContext } from "@/lib/auth/verification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?verification=invalid", url));
  }

  await setVerificationContext({ token, email });
  return NextResponse.redirect(
    new URL(`/verify-email?email=${encodeURIComponent(email)}`, url),
  );
}
