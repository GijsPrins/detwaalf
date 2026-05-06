import { test as setup } from "@playwright/test";
import { authFile } from "../fixtures/auth";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").pressSequentially(process.env.E2E_TEST_EMAIL!);
  await page
    .locator("#password")
    .pressSequentially(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: authFile });
});
