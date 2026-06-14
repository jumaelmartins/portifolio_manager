import "server-only";

import { cookies } from "next/headers";

import { VERIFICATION_COOKIE } from "./cookies";

type VerificationContext = {
  token: string;
  email: string;
};

const options = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 600,
};

export async function setVerificationContext(context: VerificationContext) {
  (await cookies()).set(
    VERIFICATION_COOKIE,
    JSON.stringify(context),
    options,
  );
}

export async function readVerificationContext() {
  const value = (await cookies()).get(VERIFICATION_COOKIE)?.value;
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<VerificationContext>;
    return typeof parsed.token === "string" && typeof parsed.email === "string"
      ? { token: parsed.token, email: parsed.email }
      : null;
  } catch {
    return null;
  }
}

export async function clearVerificationContext() {
  (await cookies()).set(VERIFICATION_COOKIE, "", {
    ...options,
    maxAge: 0,
  });
}
