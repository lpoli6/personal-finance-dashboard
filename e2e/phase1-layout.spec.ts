import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", title: "Dashboard", description: "Net worth overview" },
  { path: "/accounts", title: "Accounts", description: "Manage your accounts" },
  { path: "/transactions", title: "Transactions", description: "Import, categorise" },
  { path: "/subscriptions", title: "Subscriptions", description: "Track recurring" },
  { path: "/budget", title: "Budget", description: "Monthly budget" },
  { path: "/projections", title: "Projections", description: "Pension modelling" },
];

test.describe("All 6 pages render", () => {
  for (const page of pages) {
    test(`${page.title} page at ${page.path}`, async ({ page: p }) => {
      await p.goto(page.path);
      await expect(p.getByRole("heading", { name: page.title })).toBeVisible();
      await expect(p.getByText(page.description, { exact: false })).toBeVisible();
    });
  }
});

test.describe("Sidebar navigation", () => {
  test("desktop sidebar has all nav links", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { title } of pages) {
      await expect(sidebar.getByText(title)).toBeVisible();
    }
  });

  test("clicking sidebar links navigates correctly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Navigate to Accounts
    await page.locator("aside").getByText("Accounts").click();
    await expect(page).toHaveURL("/accounts");
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();

    // Navigate to Budget
    await page.locator("aside").getByText("Budget").click();
    await expect(page).toHaveURL("/budget");
    await expect(page.getByRole("heading", { name: "Budget" })).toBeVisible();

    // Navigate back to Dashboard
    await page.locator("aside").getByText("Dashboard").click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("active nav link is highlighted", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/accounts");

    const accountsLink = page.locator("aside a", { hasText: "Accounts" });
    await expect(accountsLink).toHaveClass(/\bbg-accent\b/);

    const dashboardLink = page.locator("aside a", { hasText: "Dashboard" });
    await expect(dashboardLink).toHaveClass(/text-muted-foreground/);
  });
});

test.describe("Dark/light mode toggle", () => {
  test("toggle switches between light and dark", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const toggleBtn = page.getByLabel("Toggle theme");
    await expect(toggleBtn).toBeVisible();

    // Click toggle — should switch to dark
    await toggleBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Click again — should switch back to light
    await toggleBtn.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

test.describe("Mobile layout", () => {
  test("sidebar hidden, bottom nav visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Desktop sidebar should be hidden
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeVisible();

    // Bottom nav should be visible
    const bottomNav = page.locator("nav.md\\:hidden");
    await expect(bottomNav).toBeVisible();
  });

  test("mobile bottom nav navigates correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Tap Accounts in bottom nav
    const bottomNav = page.locator("nav").filter({ has: page.locator("a") }).last();
    await bottomNav.getByText("Accounts").click();
    await expect(page).toHaveURL("/accounts");
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();
  });
});
