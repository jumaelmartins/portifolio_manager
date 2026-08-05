import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const role = "Portfolio Manager E2E Soft Delete Engineer";

test.describe("experience soft delete lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("archives, trashes, and restores an experience entry", async ({ page }) => {
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

    // Archive: leaves the Active tab...
    await page.getByRole("button", { name: `Archive ${role}` }).click();
    await expect(
      page.getByRole("heading", { name: "No experience yet" }),
    ).toBeVisible();

    // ...and appears under the Archived tab.
    await page.getByRole("tab", { name: "Archived" }).click();
    await expect(page.getByText(role).filter({ visible: true })).toBeVisible();

    // Move to trash: leaves the Archived tab...
    await page.goto("/experience?state=archived");
    await expect(page.getByText(role).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: `Move ${role} to trash` }).click();
    await expect(
      page.getByRole("heading", { name: "No experience yet" }),
    ).toBeVisible();

    // ...and appears under the Trash tab.
    await page.getByRole("tab", { name: "Trash" }).click();
    await expect(page.getByText(role).filter({ visible: true })).toBeVisible();

    // Restore: leaves the Trash tab...
    await page.getByRole("button", { name: `Restore ${role}` }).click();
    await expect(
      page.getByRole("heading", { name: "No experience yet" }),
    ).toBeVisible();

    // ...and returns to the Active tab.
    await page.getByRole("tab", { name: "Active" }).click();
    await expect(page.getByText(role).filter({ visible: true })).toBeVisible();
  });
});
