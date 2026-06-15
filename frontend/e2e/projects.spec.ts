import { expect, test } from "@playwright/test";

import { login, resetE2eData } from "./helpers";

const title = "Portfolio Manager E2E";

async function fillProject(
  page: Parameters<typeof login>[0],
  projectTitle: string,
) {
  await page.getByLabel("Title").fill(projectTitle);
  await page.getByLabel("Description").fill("Project created by Playwright");
  await page.getByLabel("Category").selectOption({ label: "Full Stack" });
  await page.getByRole("combobox", { name: "Technologies" }).click();
  await page.getByRole("option", { name: "TypeScript" }).click();
  await page.getByRole("option", { name: "NestJS" }).click();
  await page.keyboard.press("Escape");
}

test.describe("project management", () => {
  test.beforeEach(async ({ page }) => {
    resetE2eData();
    await login(page);
  });

  test("creates, edits, filters, and deletes a project", async ({ page }) => {
    await page.goto("/projects/new");
    await fillProject(page, title);
    await page.getByRole("button", { name: "Create Project" }).click();

    await page.waitForURL((url) => url.pathname === "/projects", {
      timeout: 20_000,
    });
    await expect(page.getByText(title).filter({ visible: true })).toBeVisible();

    await page
      .getByRole("searchbox", { name: "Search projects..." })
      .fill(title);
    await expect(page).toHaveURL(/q=Portfolio\+Manager\+E2E/);
    await expect(page.getByText(title).filter({ visible: true })).toBeVisible();

    const editLink = page.getByRole("link", { name: `Edit ${title}` });
    await Promise.all([
      page.waitForURL(/\/projects\/\d+\/edit/, { timeout: 20_000 }),
      editLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Edit project" }),
    ).toBeVisible();
    await page.getByLabel("Description").fill("Project updated by Playwright");
    await page.getByRole("button", { name: "Remove NestJS" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL((url) => url.pathname === "/projects", {
      timeout: 20_000,
    });
    await expect(
      page.getByText("Project updated by Playwright").filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByText("NestJS", { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await page.getByRole("button", { name: "Delete project" }).click();
    await expect(
      page.getByRole("heading", { name: "No projects yet" }),
    ).toBeVisible();
  });

  test("uploads a cover and reports it on the dashboard", async ({ page }) => {
    const coveredTitle = `${title} Cover`;
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );

    await page.goto("/projects/new");
    await fillProject(page, coveredTitle);
    await page.getByLabel("Upload image").setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(
      page.getByRole("button", { name: "Select Portfolio media" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Create Project" }).click();

    await page.waitForURL((url) => url.pathname === "/projects", {
      timeout: 20_000,
    });
    await page.goto("/dashboard");
    await expect(
      page.getByRole("article", { name: "Projects: 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "With cover: 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", {
        name: "Portfolio cover completeness",
      }),
    ).toHaveAttribute("aria-valuenow", "100");
  });
});
