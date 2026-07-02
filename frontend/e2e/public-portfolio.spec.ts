import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

async function seededUserId(page: Parameters<typeof login>[0]): Promise<string> {
  const res = await page.request.get("/api/profile");
  expect(res.ok()).toBeTruthy();
  const profile = (await res.json()) as { id: number };
  return String(profile.id);
}

test.describe("public portfolio", () => {
  test("renders the hero and a populated section for a real user", async ({ page }) => {
    resetE2eData();
    await login(page);

    // Create one project so the Projects section is present.
    await page.goto("/projects/new");
    await page.getByLabel("Title").fill("Public Smoke Project");
    await page.getByLabel("Description").fill("Created by the public-portfolio smoke");
    await page.getByLabel("Category").selectOption({ label: "Full Stack" });
    await page.getByRole("combobox", { name: "Technologies" }).click();
    await page.getByRole("option", { name: "TypeScript" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL((url) => url.pathname === "/projects", { timeout: 20_000 });

    const userId = await seededUserId(page);

    await page.goto(`/portfolio/${userId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await expect(page.getByText("Public Smoke Project")).toBeVisible();

    // No horizontal overflow (mobile project runs this too).
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("shows a not-found page for a missing user", async ({ page }) => {
    await page.goto("/portfolio/99999999");
    await expect(page.getByText("Portfolio not found")).toBeVisible();
  });
});
