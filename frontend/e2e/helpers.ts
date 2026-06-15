import { execFileSync } from "node:child_process";

import type { Page } from "@playwright/test";

export const E2E_EMAIL = "e2e@portfolio.test";
export const E2E_PASSWORD = "E2eStrongP@ss1";
export const E2E_VERIFICATION_TOKEN = "e2e-verification-token".padEnd(64, "0");

export function resetE2eData() {
  const windows = process.platform === "win32";
  execFileSync(
    windows ? (process.env.ComSpec ?? "cmd.exe") : "npm",
    windows
      ? ["/d", "/s", "/c", "npm --prefix ../backend run prisma:e2e:seed"]
      : ["--prefix", "../backend", "run", "prisma:e2e:seed"],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(E2E_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}
