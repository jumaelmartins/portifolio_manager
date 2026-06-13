import { defineConfig } from "@playwright/test";

const baseURL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
