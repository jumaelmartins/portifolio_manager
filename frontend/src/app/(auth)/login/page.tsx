import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    verified?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : undefined;
  const verified = params.verified === "1";

  return <LoginForm nextPath={nextPath} verified={verified} />;
}
