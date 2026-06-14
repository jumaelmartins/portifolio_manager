"use client";

import { useQuery } from "@tanstack/react-query";

export type SessionUser = {
  id: number;
  username: string | null;
  email: string;
  role_id: number;
  status_id?: number;
};

async function getSession(): Promise<SessionUser> {
  const response = await fetch("/api/session", { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Unable to load session");
  }

  return response.json();
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 60_000,
    retry: false,
  });
}
