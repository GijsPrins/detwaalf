import { expect, test } from "./fixtures/auth";

test("a regular signed-in session cannot open the password reset form", async ({
  page,
}) => {
  await page.goto("/update-password");

  await expect(
    page.getByText(
      "Deze herstellink is ongeldig of verlopen. Vraag een nieuwe link aan.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Wachtwoord opslaan" }),
  ).not.toBeVisible();
});
