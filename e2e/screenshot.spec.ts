import { test } from "@playwright/test";

test("capture desktop screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/desktop-dashboard-light.png", fullPage: true });

  await page.getByLabel("Toggle theme").click();
  await page.screenshot({ path: "screenshots/desktop-dashboard-dark.png", fullPage: true });

  await page.getByLabel("Toggle theme").click();
  await page.locator("aside").getByText("Accounts").click();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/desktop-accounts.png", fullPage: true });
});

test("capture mobile screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/mobile-dashboard.png", fullPage: true });
});
