"use client";

import { useQuery } from "@tanstack/react-query";

import type { DashboardData } from "../types";

async function getDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Unable to load dashboard");
  }

  return response.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000,
    retry: false,
  });
}
