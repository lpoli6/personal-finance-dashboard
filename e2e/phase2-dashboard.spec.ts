import { test, expect } from "@playwright/test";

test("capture dashboard screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Wait for charts to render
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "screenshots/dashboard-light.png", fullPage: true });

  await page.getByLabel("Toggle theme").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/dashboard-dark.png", fullPage: true });
});

test("capture mobile dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "screenshots/dashboard-mobile.png", fullPage: true });
});

test("dashboard has summary cards with data", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check net worth card exists with a GBP value
  await expect(page.getByText("Net Worth").first()).toBeVisible();
  await expect(page.getByText(/£[\d,]+\.\d{2}/).first()).toBeVisible();

  // Check MoM and YoY cards
  await expect(page.getByText("Month-on-Month", { exact: true })).toBeVisible();
  await expect(page.getByText("Year-on-Year", { exact: true })).toBeVisible();
});

test("dashboard has charts", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check chart titles
  await expect(page.getByText("Net Worth").first()).toBeVisible();
  await expect(page.getByText("Asset Allocation")).toBeVisible();
  await expect(page.getByText("Monthly Changes")).toBeVisible();
});

test("monthly snapshot table renders", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Monthly Snapshot")).toBeVisible();
  // Check the table has account names
  await expect(page.getByText("Marcus (Cash Savings)")).toBeVisible();
  await expect(page.getByText("Vanguard ISA")).toBeVisible();
});

test("month selector works", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Open the month selector
  const trigger = page.locator("[data-slot='select-trigger']");
  await trigger.click();

  // Select Feb 2025
  await page.getByRole("option", { name: "Feb 2025" }).click();

  // The table should still render
  await expect(page.getByText("Monthly Snapshot")).toBeVisible();
});
