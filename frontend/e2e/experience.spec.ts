import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const role = "Portfolio Manager E2E Engineer";

test.describe("experience management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("creates, edits, and deletes an experience", async ({ page }) => {
    await page.goto("/experience/new");
    await page.getByLabel("Job title").fill(role);
    await page.getByLabel("Company").fill("Acme Corp");
    await page.getByLabel("Description").fill("Experience created by Playwright");
    await page.getByLabel("Start date").fill("2022-01-01");
    await page.getByLabel("Currently working here").check();
    await page.getByRole("button", { name: "Create Experience" }).click();

    await page.waitForURL((url) => url.pathname === "/experience", {
      timeout: 20_000,
    });
    await expect(page.getByText(role).filter({ visible: true })).toBeVisible();

    const editLink = page.getByRole("link", { name: `Edit ${role}` });
    await Promise.all([
      page.waitForURL(/\/experience\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit experience" }),
    ).toBeVisible();
    await page.getByLabel("Company").fill("Acme Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/experience", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("Acme Updated").filter({ visible: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: `Delete ${role}` }).click();
    await page.getByRole("button", { name: "Delete experience" }).click();
    await expect(
      page.getByRole("heading", { name: "No experience yet" }),
    ).toBeVisible();
  });
});
