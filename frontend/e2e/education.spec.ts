import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const degree = "Portfolio Manager E2E BSc";

test.describe("education management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("creates, edits, and deletes an education entry", async ({ page }) => {
    await page.goto("/education/new");
    await page.getByLabel("Degree / title").fill(degree);
    await page.getByLabel("Institution").fill("MIT");
    await page.getByLabel("Description").fill("Education created by Playwright");
    await page.getByLabel("Start date").fill("2018-01-01");
    await page.getByLabel("Currently studying here").check();
    await page.getByRole("button", { name: "Create Education" }).click();

    await page.waitForURL((url) => url.pathname === "/education", {
      timeout: 20_000,
    });
    await expect(page.getByText(degree).filter({ visible: true })).toBeVisible();

    const editLink = page.getByRole("link", { name: `Edit ${degree}` });
    await Promise.all([
      page.waitForURL(/\/education\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit education" }),
    ).toBeVisible();
    await page.getByLabel("Institution").fill("MIT Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/education", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("MIT Updated").filter({ visible: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: `Delete ${degree}` }).click();
    await page.getByRole("button", { name: "Delete education" }).click();
    await expect(
      page.getByRole("heading", { name: "No education yet" }),
    ).toBeVisible();
  });
});
