import "server-only";

import type { PublicPortfolio } from "../types";
import { normalizePortfolio } from "./normalize-portfolio";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function getPublicPortfolio(userId: string): Promise<PublicPortfolio | null> {
  const res = await fetch(`${BACKEND_URL}/public/users/${userId}`, {
    next: { tags: [`portfolio:${userId}`], revalidate: 3600 },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load portfolio ${userId}: ${res.status}`);
  }

  return normalizePortfolio(await res.json());
}
