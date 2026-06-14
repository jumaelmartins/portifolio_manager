import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/projects"];
const authPaths = ["/login", "/register", "/verify-email"];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(
    process.env.SESSION_COOKIE_NAME ?? "pm_session",
  );
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/login",
    "/register",
    "/verify-email",
  ],
};
