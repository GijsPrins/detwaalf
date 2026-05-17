import { test, expect } from "./fixtures/auth";
import type { Page } from "@playwright/test";

// Target event card links (href="/events/{uuid}"), not nav or "new event" links
const eventCardLink = 'a[href^="/events/"]:not([href="/events/new"])';

async function chooseFirstDistanceIfNeeded(page: Page) {
  const distanceSelect = page.locator("#participationDistance");
  if (await distanceSelect.isVisible()) {
    await distanceSelect.selectOption({ index: 1 });
  }
}

test.describe("Event participation flow", () => {
  test("user can set participation status to interested", async ({ page }) => {
    await page.goto("/events");
    await page.locator(eventCardLink).first().click();
    await page.waitForURL(/\/events\/[^/?]+(\?.*)?$/);
    await page.getByRole("button", { name: "Mijn deelname" }).click();

    // Clear any existing status first so the test starts clean
    const clearButton = page.getByRole("button", { name: "Geen status" });
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }

    await chooseFirstDistanceIfNeeded(page);
    await page.getByRole("button", { name: "Geïnteresseerd" }).click();

    await expect(page.getByText("Geïnteresseerd").first()).toBeVisible();
  });

  test("user can change status from interested to signed up", async ({
    page,
  }) => {
    await page.goto("/events");
    await page.locator(eventCardLink).first().click();
    await page.waitForURL(/\/events\/[^/?]+(\?.*)?$/);
    await page.getByRole("button", { name: "Mijn deelname" }).click();

    await chooseFirstDistanceIfNeeded(page);
    await page.getByRole("button", { name: "Geïnteresseerd" }).click();
    await page.getByRole("button", { name: "Ingeschreven" }).click();

    await expect(page.getByText("Ingeschreven").first()).toBeVisible();
  });

  test("user can clear participation status", async ({ page }) => {
    await page.goto("/events");
    await page.locator(eventCardLink).first().click();
    await page.waitForURL(/\/events\/[^/?]+(\?.*)?$/);
    await page.getByRole("button", { name: "Mijn deelname" }).click();

    // Set a status first
    await chooseFirstDistanceIfNeeded(page);
    await page.getByRole("button", { name: "Geïnteresseerd" }).click();
    await expect(page.getByText("Geïnteresseerd").first()).toBeVisible();

    // Then clear it
    await page.getByRole("button", { name: "Geen status" }).click();

    await expect(
      page.locator(".bg-orange-100.text-orange-700"),
    ).not.toBeVisible();
  });
});
