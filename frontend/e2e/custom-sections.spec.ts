import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const sectionName = "E2E Awards";

test.describe("custom sections management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("creates a section, manages an item, then deletes both", async ({
    page,
  }) => {
    // Create a section with a single "Title" field.
    await page.goto("/custom-sections/new");
    await page.getByLabel("Section name").fill(sectionName);
    await page.getByLabel("Description").fill("Recognitions and prizes");
    await page.getByLabel("Field label").fill("Title");
    await page.getByRole("button", { name: "Create Section" }).click();

    await page.waitForURL((url) => url.pathname === "/custom-sections", {
      timeout: 20_000,
    });
    await expect(
      page.getByText(sectionName).filter({ visible: true }),
    ).toBeVisible();

    // Open the items drawer and add one item.
    await page.getByRole("button", { name: "Manage items" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.getByLabel("Title").fill("Best Developer 2026");
    await page.getByRole("button", { name: "Add Item" }).click();

    await expect(
      page.getByText("Best Developer 2026").filter({ visible: true }),
    ).toBeVisible();

    // Delete the item, back to the empty item list. The row trash button and
    // the confirm button share the "Delete item" label, so scope the confirm
    // to the dialog to avoid a strict-mode match on both.
    await page.getByRole("button", { name: "Delete item" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete item" })
      .click();
    await expect(
      page.getByText("No items yet. Add the first one."),
    ).toBeVisible();

    // Close the drawer, then delete the section.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: `Delete ${sectionName}` }).click();
    await page.getByRole("button", { name: "Delete section" }).click();
    await expect(
      page.getByRole("heading", { name: "No custom sections yet" }),
    ).toBeVisible();
  });
});
