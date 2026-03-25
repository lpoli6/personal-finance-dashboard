import { test, expect } from "@playwright/test";

// === SUBSCRIPTIONS PAGE ===

test("subscriptions page shows summary cards", async ({ page }) => {
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Monthly Burn")).toBeVisible();
  await expect(page.getByText("Annual Cost")).toBeVisible();
  await expect(page.getByText("Most Expensive", { exact: true })).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: "Mounjaro" })).toBeVisible();
});

test("subscriptions grouped by category", async ({ page }) => {
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Fitness", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Entertainment", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Improvement", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Car", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Miscellaneous", { exact: true }).first()).toBeVisible();
});

test("subscriptions has category donut chart", async ({ page }) => {
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("By Category")).toBeVisible();
});

test("subscriptions has audit callout", async ({ page }) => {
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Worth Reviewing", { exact: true })).toBeVisible();
  await expect(page.getByText(/Mounjaro.*most expensive/)).toBeVisible();
});

test("add subscription button opens dialog", async ({ page }) => {
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");

  await page.getByText("Add Subscription").click();
  await expect(page.getByText("Track a new recurring cost.")).toBeVisible();
});

// === BUDGET PAGE ===

test("budget page shows waterfall chart", async ({ page }) => {
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Monthly Budget", { exact: true })).toBeVisible();
  await expect(page.getByText("discretionary", { exact: true })).toBeVisible();
});

test("budget items table renders", async ({ page }) => {
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Budget Items")).toBeVisible();
  await expect(page.getByText("Monthly Take-Home")).toBeVisible();
  await expect(page.getByText("Vanguard Investment")).toBeVisible();
});

test("planned expenses table renders with priorities", async ({ page }) => {
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Planned Expenses")).toBeVisible();
  await expect(page.getByRole("cell", { name: /Wedding/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Tax Reserve/ })).toBeVisible();
  // Check priority badges exist
  await expect(page.getByText("Essential").first()).toBeVisible();
  await expect(page.getByText("High").first()).toBeVisible();
});

test("planned expenses shows budget summary", async ({ page }) => {
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("£150,000.00")).toBeVisible(); // total budget
  await expect(page.getByText("£137,000.00")).toBeVisible(); // total planned
  await expect(page.getByText("£13,000.00")).toBeVisible(); // buffer
});

test("budget vs actual placeholder shows", async ({ page }) => {
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Import transactions to see budget vs actual spending.")).toBeVisible();
});

// === SCREENSHOTS ===

test("capture subscriptions screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/subscriptions");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/subscriptions-page.png", fullPage: true });
});

test("capture budget screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/budget");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/budget-page.png", fullPage: true });
});
