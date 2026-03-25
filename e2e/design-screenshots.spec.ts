import { test } from "@playwright/test";

test("capture refined dashboard dark", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/refined-dashboard-dark.png", fullPage: true });
});

test("capture refined dashboard light", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.getByLabel("Toggle theme").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/refined-dashboard-light.png", fullPage: true });
});

test("capture refined subscriptions dark", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/refined-subscriptions-dark.png", fullPage: true });
});

test("capture refined transactions dark", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/refined-transactions-dark.png", fullPage: true });
});
