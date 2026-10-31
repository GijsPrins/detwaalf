import { expect, test } from "./fixtures/auth";

test.describe("Contact form", () => {
  test("authenticated verified user can send a message", async ({ page }) => {
    const uniqueMessage = `E2E contact message ${Date.now()}`;
    const sentRequests: { body: unknown; authorization: string | undefined }[] = [];

    // Answer the POST here: every CI run sending a real message hits the
    // per-user rate limit (10 a day) and emails the admins.
    await page.route("**/api/contact-messages", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      sentRequests.push({
        body: route.request().postDataJSON(),
        authorization: route.request().headers().authorization,
      });
      await route.fulfill({ json: { id: "e2e-contact-message" } });
    });

    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    await page.getByRole("combobox").selectOption("general");
    await page.locator("textarea").fill(uniqueMessage);
    await page.getByRole("button", { name: "Versturen" }).click();

    await expect(page.getByText("Bericht ontvangen")).toBeVisible();
    await expect(
      page.getByText("Je vindt antwoorden terug onder Berichten."),
    ).toBeVisible();
    expect(sentRequests).toHaveLength(1);
    expect(sentRequests[0]!.body).toMatchObject({
      type: "general",
      message: uniqueMessage,
    });
    expect(sentRequests[0]!.authorization).toMatch(/^Bearer \S+/);
  });
});
