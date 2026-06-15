import { expect, test } from "@playwright/test";

import {
  E2E_EMAIL,
  E2E_PASSWORD,
  E2E_VERIFICATION_TOKEN,
  resetE2eData,
} from "./helpers";

test.describe("authentication", () => {
  test("redirects unauthenticated protected routes to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  });

  test("local login and logout protect the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(E2E_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);
  });

  test("registration opens verification with the registered email", async ({
    page,
  }, testInfo) => {
    const email = `register-${testInfo.project.name}-${Date.now()}@portfolio.test`;

    await page.goto("/register");
    await page.getByLabel("Username").fill("e2e_registration");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
    await page
      .getByLabel("Confirm password", { exact: true })
      .fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page).toHaveURL(/\/verify-email\?email=/);
    await expect(
      page.getByRole("heading", { name: "Verify your email" }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("pending local login opens its verification challenge", async ({
    page,
  }) => {
    resetE2eData();
    await page.goto("/login");
    await page.getByLabel("Email address").fill("verify@portfolio.test");
    await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(
      /\/verify-email\?email=verify%40portfolio\.test/,
    );
  });

  test("verifies an email challenge from its link", async ({ page }) => {
    resetE2eData();
    await page.goto(
      `/api/auth/verification-link?token=${E2E_VERIFICATION_TOKEN}&email=verify%40portfolio.test`,
    );
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Verify Email" }).click();

    await expect(page).toHaveURL(/\/login\?verified=1/);
    await expect(page.getByRole("status")).toContainText("Email verified");
  });

  test("accepts a state-bound Google handoff without leaking its token", async ({
    context,
    page,
    request,
  }) => {
    const loginResponse = await request.post(
      "http://localhost:3000/auth/login",
      {
        data: { email: E2E_EMAIL, password: E2E_PASSWORD },
      },
    );
    expect(loginResponse.ok()).toBeTruthy();
    const { access_token: token } = (await loginResponse.json()) as {
      access_token: string;
    };
    const state = "e2e-oauth-state";

    await context.addCookies([
      {
        name: "pm_oauth_state",
        value: state,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/login");
    await page.evaluate(
      ({ handoffToken, handoffState }) => {
        const form = document.createElement("form");
        form.method = "post";
        form.action = "/api/auth/google/callback";
        for (const [name, value] of Object.entries({
          token: handoffToken,
          state: handoffState,
        })) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.append(input);
        }
        document.body.append(form);
        form.submit();
      },
      { handoffToken: token, handoffState: state },
    );

    await expect(page).toHaveURL(/\/dashboard/);
    expect(page.url()).not.toContain(token);
    const browserStorage = await page.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage)),
    }));
    expect(JSON.stringify(browserStorage)).not.toContain(token);
    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "pm_session",
    );
    expect(sessionCookie).toMatchObject({
      httpOnly: true,
      sameSite: "Lax",
    });
  });
});
