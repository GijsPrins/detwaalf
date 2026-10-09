import { test, expect } from "@playwright/test";

test("public event views do not render unsafe stored links", async ({ page }) => {
  const id = "00000000-0000-0000-0000-000000000001";
  await page.route("**/rest/v1/events?**", (route) => {
    const event = {
      id, name: "URL security test", event_date: "2027-01-01",
      province_id: 1, location: null, created_by: id,
      event_url: "javascript:alert(1)", registration_url: "data:text/html,test",
      registration_opens: null, registration_deadline: null,
      province: { id: 1, name: "Drenthe", slug: "drenthe" },
      event_distances: [],
    };
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(new URL(route.request().url()).searchParams.has("id") ? event : [event]),
    });
  });
  await page.goto(`/events/${id}`);
  await expect(page.getByRole("heading", { name: "URL security test" })).toBeVisible();
  await expect(page.locator('a[href^="javascript:"], a[href^="data:"]')).toHaveCount(0);
});
