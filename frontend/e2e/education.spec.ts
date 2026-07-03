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
    // 12 seeded rows remain, so the list is never empty — assert the deleted
    // entry is gone instead of the empty-state heading.
    await expect(page.getByText(degree)).toHaveCount(0);
  });

  test("paginates, sorts, and searches the education list", async ({ page }) => {
    await page.goto("/education");

    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 12").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText("Seeded Education 01")).toHaveCount(0);

    // Page 2 holds the two oldest seeded entries.
    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page.getByText("Showing 11–12 of 12")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 01").filter({ visible: true }),
    ).toBeVisible();

    // Oldest-start sort brings the oldest entry onto page 1.
    await page.getByRole("button", { name: "Page 1" }).click();
    await page.getByRole("combobox", { name: "Sort" }).click();
    await page.getByRole("option", { name: "Oldest start" }).click();
    await expect(
      page.getByText("Seeded Education 01").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText("Seeded Education 12")).toHaveCount(0);

    // Search narrows to a single row.
    await page.getByRole("searchbox").fill("Seeded Education 05");
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();
    await expect(
      page.getByText("Seeded Education 05").filter({ visible: true }),
    ).toBeVisible();
  });
});
