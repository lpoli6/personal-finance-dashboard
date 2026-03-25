import { test, expect } from "@playwright/test";

test("accounts page shows all 11 accounts across 5 categories", async ({ page }) => {
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");

  // Check all 5 category groups exist
  await expect(page.getByText("Cash", { exact: true })).toBeVisible();
  await expect(page.getByText("ISA", { exact: true })).toBeVisible();
  await expect(page.getByText("Pension", { exact: true })).toBeVisible();
  await expect(page.getByText("Investments", { exact: true })).toBeVisible();
  await expect(page.getByText("Property", { exact: true }).first()).toBeVisible();

  // Check some accounts
  await expect(page.getByText("Marcus (Cash Savings)")).toBeVisible();
  await expect(page.getByText("Vanguard ISA")).toBeVisible();
  await expect(page.getByText("Pension 1 (Fidelity, Palantir)")).toBeVisible();
  await expect(page.getByText("Home Equity")).toBeVisible();
  await expect(page.getByText("Mortgage").first()).toBeVisible();
});

test("accounts have balance values displayed", async ({ page }) => {
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");

  // Should show GBP-formatted balances
  await expect(page.getByText(/£[\d,]+\.\d{2}/).first()).toBeVisible();
});

test("property and mortgage details show", async ({ page }) => {
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Property Details")).toBeVisible();
  await expect(page.getByText("Mortgage Details")).toBeVisible();
  await expect(page.getByText("5.51%")).toBeVisible();
  await expect(page.getByText("£2,477.27")).toBeVisible();
});

test("collapsible categories work", async ({ page }) => {
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");

  // Marcus should be visible initially
  await expect(page.getByText("Marcus (Cash Savings)")).toBeVisible();

  // Click Cash header to collapse
  await page.getByText("Cash", { exact: true }).click();

  // Marcus should be hidden
  await expect(page.getByText("Marcus (Cash Savings)")).not.toBeVisible();

  // Click again to expand
  await page.getByText("Cash", { exact: true }).click();
  await expect(page.getByText("Marcus (Cash Savings)")).toBeVisible();
});

test("add account button opens dialog", async ({ page }) => {
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");

  await page.getByText("Add Account").click();
  await expect(page.getByText("Create a new account to track.")).toBeVisible();
});

test("capture accounts page screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/accounts");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/accounts-page.png", fullPage: true });
});
