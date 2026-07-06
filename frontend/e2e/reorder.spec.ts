// frontend/e2e/reorder.spec.ts
import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

test.describe("manual reorder", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("reordering experience persists across reload", async ({ page }) => {
    await page.goto("/experience");

    // Switch to Manual order
    await page.getByLabel("Sort").click();
    await page.getByRole("option", { name: "Manual order" }).click();

    const handles = page.getByRole("button", { name: /^Reorder / });
    await expect(handles.first()).toBeVisible();

    // Capture the first two labels
    const firstLabelBefore = await handles.nth(0).getAttribute("aria-label");

    // Keyboard reorder: focus first handle, lift, move down, drop
    await handles.nth(0).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");

    // After reload the new order persists (order column is source of truth)
    await page.reload();
    await page.getByLabel("Sort").click();
    await page.getByRole("option", { name: "Manual order" }).click();
    const handlesAfter = page.getByRole("button", { name: /^Reorder / });
    await expect(handlesAfter.nth(0)).not.toHaveAttribute(
      "aria-label",
      firstLabelBefore ?? "",
    );
  });
});
