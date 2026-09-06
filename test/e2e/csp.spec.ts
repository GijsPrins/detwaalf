import { expect, test } from "@playwright/test";

test("login and authenticated pages work without CSP violations", async ({ page }) => {
  const violations: string[] = [];
  const errors: string[] = [];
  await page.exposeFunction("recordCspViolation", (directive: string) => violations.push(directive));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      Reflect.get(window, "recordCspViolation")(event.effectiveDirective);
    });
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/login");
  await page.locator("#email").fill(process.env.E2E_TEST_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const path of ["/dashboard", "/events", "/events/new", "/profile"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator("main")).toBeVisible();
  }
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("SSR nonces rotate and match the scripts on each response", async ({ page }) => {
  let previousNonce = "";
  for (const path of ["/login", "/login", "/register", "/privacy"]) {
    const response = await page.goto(path);
    expect(response).not.toBeNull();
    const headers = response!.headers();
    const nonce = headers["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(nonce).not.toBe(previousNonce);
    expect(headers["content-security-policy"]).toContain("'strict-dynamic'");
    expect(headers["content-security-policy-report-only"]).toBeUndefined();
    expect(headers["cache-control"]).toContain("no-store");
    const scriptNonces = await page.locator("script").evaluateAll((scripts) =>
      scripts.map((script) => script.nonce),
    );
    expect(scriptNonces.length).toBeGreaterThan(0);
    expect(scriptNonces.every((value) => value === nonce)).toBe(true);
    previousNonce = nonce!;
  }
});

test("CSP blocks injected inline and same-origin scripts while Nuxt hydrates", async ({ page }) => {
  await page.route("**/csp-test-injected.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "window.__cspExternalExecuted = true" }),
  );
  await page.route("**/login", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "</head>",
      '<script>window.__cspInlineExecuted = true</script><script src="/csp-test-injected.js"></script></head>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/login");
  await expect(page.locator("#email")).toBeVisible();
  const injected = await page.evaluate(() => ({
    inline: Reflect.get(window, "__cspInlineExecuted"),
    external: Reflect.get(window, "__cspExternalExecuted"),
  }));
  expect(injected).toEqual({ inline: undefined, external: undefined });
  // A Vue navigation verifies hydration; a full-page fallback would lose the marker.
  await page.evaluate(() => Reflect.set(window, "__cspNavigationMarker", true));
  await page.getByRole("link", { name: "Wachtwoord vergeten?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  expect(await page.evaluate(() => Reflect.get(window, "__cspNavigationMarker"))).toBe(true);
});
