import type { Metadata } from "next";

import type { PublicPortfolio } from "../types";

export function buildPortfolioMetadata(
  portfolio: PublicPortfolio | null,
  userId: string,
): Metadata {
  if (!portfolio) {
    return { title: "Portfolio not found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const name = portfolio.username ?? "Portfolio";
  const title = `${name} — Portfolio`;
  const description = `${portfolio.role} · ${portfolio.projects.length} projects`;
  const url = `${appUrl}/portfolio/${userId}`;
  const images = portfolio.avatarUrl ? [`${appUrl}${portfolio.avatarUrl}`] : [];

  return {
    title,
    description,
    openGraph: { type: "profile", url, title, description, images },
    twitter: { card: "summary_large_image", title, description },
  };
}
