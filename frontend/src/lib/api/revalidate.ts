import "server-only";

import { decodeJwt } from "jose";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/cookies";

export async function revalidatePortfolio(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const sub = decodeJwt(token).sub;
  if (!sub) return;
  revalidateTag(`portfolio:${sub}`, "max");
}
