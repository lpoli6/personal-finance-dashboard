import { test, expect } from "@playwright/test";

test("transactions page renders with tabs", async ({ page }) => {
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Transactions", { exact: true }).first()).toBeVisible();
  // Check tabs exist
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Transactions" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Statements" })).toBeVisible();
});

test("transactions overview shows empty state", async ({ page }) => {
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Import a statement to see spending analysis")).toBeVisible();
});

test("import statement button opens wizard", async ({ page }) => {
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");

  await page.getByText("Import Statement").first().click();
  await expect(page.getByText("Select your bank format")).toBeVisible();
});

test("statements tab renders", async ({ page }) => {
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: "Statements" }).click();
  // Should show import button or empty state
  await expect(page.getByText("Import Statement").first()).toBeVisible();
});

test("capture transactions page screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/transactions");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/transactions-page.png", fullPage: true });
});
