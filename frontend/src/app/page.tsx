import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/auth/cookies";

export default async function Home() {
  const hasSession = (await cookies()).has(SESSION_COOKIE);
  redirect(hasSession ? "/dashboard" : "/login");
}
