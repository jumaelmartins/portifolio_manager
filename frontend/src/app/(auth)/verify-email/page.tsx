import type { Metadata } from "next";

import { VerificationForm } from "@/features/auth/components/verification-form";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return <VerificationForm email={email} />;
}
