import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const course = "Portfolio Manager E2E Bootcamp";

test.describe("courses management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("creates, edits, and deletes a course", async ({ page }) => {
    await page.goto("/courses/new");
    await page.getByLabel("Course title").fill(course);
    await page.getByLabel("Institution").fill("Coursera");
    await page.getByLabel("Description").fill("Course created by Playwright");
    await page.getByLabel("Start date").fill("2021-03-01");
    await page.getByLabel("Currently enrolled").check();
    await page.getByRole("button", { name: "Create Course" }).click();

    await page.waitForURL((url) => url.pathname === "/courses", {
      timeout: 20_000,
    });
    await expect(page.getByText(course).filter({ visible: true })).toBeVisible();

    const editLink = page.getByRole("link", { name: `Edit ${course}` });
    await Promise.all([
      page.waitForURL(/\/courses\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit course" }),
    ).toBeVisible();
    await page.getByLabel("Institution").fill("Coursera Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/courses", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("Coursera Updated").filter({ visible: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: `Delete ${course}` }).click();
    await page.getByRole("button", { name: "Delete course" }).click();
    await expect(
      page.getByRole("heading", { name: "No courses yet" }),
    ).toBeVisible();
  });
});
