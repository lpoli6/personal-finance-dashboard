import { test, expect } from "@playwright/test";

test("projections page renders with tabs", async ({ page }) => {
  await page.goto("/projections");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("tab", { name: "Pension Modeller" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Investment Projections" })).toBeVisible();
});

test("pension modeller shows controls and chart", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projections");
  await page.waitForLoadState("networkidle");

  // Check controls exist
  await expect(page.getByText("Current Pension").first()).toBeVisible();
  await expect(page.getByText("Annual Return").first()).toBeVisible();
  await expect(page.getByText("Retirement Age").first()).toBeVisible();

  // Check preset buttons
  await expect(page.getByText("Conservative")).toBeVisible();
  await expect(page.getByText("Moderate")).toBeVisible();
  await expect(page.getByText("Aggressive")).toBeVisible();

  // Check summary cards exist
  await expect(page.getByText("Projected (Nominal)").first()).toBeVisible();
});

test("pension modeller has year-by-year table", async ({ page }) => {
  await page.goto("/projections");
  await page.waitForLoadState("networkidle");

  // Should have a table with Year and Age columns
  await expect(page.getByText("Year-by-Year Breakdown")).toBeVisible();
});

test("investment projections tab renders", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projections");
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: "Investment Projections" }).click();
  await page.waitForTimeout(500);

  // Should show projection table with return rates
  await expect(page.getByText("At 6% Return").first()).toBeVisible();
  await expect(page.getByText("At 8% Return").first()).toBeVisible();
  await expect(page.getByText("At 10% Return").first()).toBeVisible();
});

test("investment projections shows pot values", async ({ page }) => {
  await page.goto("/projections");
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: "Investment Projections" }).click();
  await page.waitForTimeout(500);

  // Should show ISA and Pension rows
  await expect(page.getByText("ISA").first()).toBeVisible();
  await expect(page.getByText("Pension").first()).toBeVisible();
});

test("capture projections screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/projections");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/projections-pension.png", fullPage: true });

  await page.getByRole("tab", { name: "Investment Projections" }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/projections-investments.png", fullPage: true });
});
