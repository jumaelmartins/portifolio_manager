import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

// Categories/Technologies are GLOBAL lookups. These specs only ever touch
// throwaway "E2E "-prefixed rows (cleaned by the seed) — never the seeded
// globals, which projects reference and must not be deleted.

test.describe("lookups management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("categories: creates, edits, and deletes a category", async ({ page }) => {
    await page.goto("/categories/new");
    await page.getByLabel("Name").fill("E2E Category");
    await page.getByRole("button", { name: "Create Category" }).click();

    await page.waitForURL((url) => url.pathname === "/categories", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("E2E Category").filter({ visible: true }),
    ).toBeVisible();

    const editLink = page.getByRole("link", { name: "Edit E2E Category" });
    await Promise.all([
      page.waitForURL(/\/categories\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit category" }),
    ).toBeVisible();
    await page.getByLabel("Name").fill("E2E Category Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/categories", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("E2E Category Updated").filter({ visible: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Delete E2E Category Updated" })
      .click();
    await page.getByRole("button", { name: "Delete category" }).click();
    await expect(
      page.getByText("E2E Category Updated"),
    ).toHaveCount(0);
  });

  test("technologies: creates and edits; delete hidden for regular user", async ({
    page,
  }) => {
    await page.goto("/technologies/new");
    await page.getByLabel("Name").fill("E2E Technology");
    await page.getByRole("button", { name: "Create Technology" }).click();

    await page.waitForURL((url) => url.pathname === "/technologies", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("E2E Technology").filter({ visible: true }),
    ).toBeVisible();

    const editLink = page.getByRole("link", { name: "Edit E2E Technology" });
    await Promise.all([
      page.waitForURL(/\/technologies\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit technology" }),
    ).toBeVisible();
    await page.getByLabel("Name").fill("E2E Technology Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/technologies", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("E2E Technology Updated").filter({ visible: true }),
    ).toBeVisible();

    // Regular (non-sysadmin) users cannot delete technologies — the delete
    // control is role-gated away in the UI.
    await expect(
      page.getByRole("button", { name: "Delete E2E Technology Updated" }),
    ).toHaveCount(0);
  });
});
