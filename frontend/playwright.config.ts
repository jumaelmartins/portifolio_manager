import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "docker compose -f ../docker-compose.e2e.yml up e2e-db",
      port: 55432,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm --prefix ../backend run start:e2e",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname localhost",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BACKEND_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3001",
        SESSION_COOKIE_NAME: "pm_session",
        VERIFICATION_COOKIE_NAME: "pm_verification",
        OAUTH_STATE_COOKIE_NAME: "pm_oauth_state",
      },
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
