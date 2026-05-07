import { expect, test } from "./fixtures/auth";

test.describe("Contact form", () => {
  test("authenticated verified user can send a message", async ({ page }) => {
    const uniqueMessage = `E2E contact message ${Date.now()}`;

    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    await page.getByRole("combobox").selectOption("general");
    await page.locator("textarea").fill(uniqueMessage);
    await page.getByRole("button", { name: "Versturen" }).click();

    await expect(page.getByText("Bericht ontvangen")).toBeVisible();
    await expect(
      page.getByText("We nemen zo snel mogelijk contact met je op."),
    ).toBeVisible();
  });
});
