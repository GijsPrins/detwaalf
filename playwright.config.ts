import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load .env so E2E_TEST_EMAIL / E2E_TEST_PASSWORD are available locally
// without having to export them in the shell. In CI these come from secrets.
config();

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
