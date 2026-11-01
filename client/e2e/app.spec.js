import { expect, test } from "@playwright/test";

// Fixture accounts from api/scripts/fixtures.js (in-memory database only).
const PASSWORD = "Fixture#2024";
const ADMIN = "admin@smp.test";
const USER = "buyer@smp.test";

async function login(page, email) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("unauthenticated visitors are sent to sign-in, never a blank page", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("admin: sign in, dashboard, refresh and deep links keep the session", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page.getByText("Total users")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Total users")).toBeVisible();

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: "Browse products" })).toBeVisible();
});

test("admin: search, paginate, block and unblock a user", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin/users");
  await expect(page.getByText(/19 users in total/)).toBeVisible();

  await page.getByRole("listitem", { name: "Next Page" }).click();
  await expect(page).toHaveURL(/page=2/);

  await page.getByLabel("Search users").fill("bailey");
  await expect(page).toHaveURL(/q=bailey/);
  const row = page.getByRole("row", { name: /Bailey Buyer/ });
  await expect(row).toBeVisible();
  await expect(page.getByText(/1 user match/)).toBeVisible();

  await row.getByRole("button", { name: /Actions for Bailey Buyer/ }).click();
  await page.getByRole("menuitem", { name: "Block user" }).click();
  await page.getByRole("button", { name: "Block user" }).click();
  await expect(row.getByText("Blocked")).toBeVisible();

  await row.getByRole("button", { name: /Actions for Bailey Buyer/ }).click();
  await page.getByRole("menuitem", { name: "Unblock user" }).click();
  await page.getByRole("button", { name: "Unblock user" }).click();
  await expect(row.getByText("Active")).toBeVisible();
});

test("normal user: cannot open admin pages", async ({ page }) => {
  await login(page, USER);
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  await page.goto("/admin/users");
  await expect(page.getByText("Access denied")).toBeVisible();
});

test("blocked session: the user is signed out on their next request", async ({ browser }) => {
  const userCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  const userPage = await userCtx.newPage();
  const adminPage = await adminCtx.newPage();

  await login(userPage, "seller@smp.test");
  await login(adminPage, ADMIN);
  await adminPage.goto("/admin/users?q=seller");
  const row = adminPage.getByRole("row", { name: /Sam Seller/ });
  await row.getByRole("button", { name: /Actions for Sam Seller/ }).click();
  await adminPage.getByRole("menuitem", { name: "Block user" }).click();
  await adminPage.getByRole("button", { name: "Block user" }).click();
  await expect(row.getByText("Blocked")).toBeVisible();

  await userPage.goto("/my-products");
  await expect(userPage).toHaveURL(/\/login$/);
  await expect(userPage.getByText(/account has been blocked/i)).toBeVisible();

  // Restore for later tests.
  await row.getByRole("button", { name: /Actions for Sam Seller/ }).click();
  await adminPage.getByRole("menuitem", { name: "Unblock user" }).click();
  await adminPage.getByRole("button", { name: "Unblock user" }).click();
  await userCtx.close();
  await adminCtx.close();
});

test("logout ends the session and the back button does not reveal protected pages", async ({ page }) => {
  await login(page, USER);
  await page.goto("/my-bids");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
  const me = await page.request.get("/api/v1/auth/me");
  expect(me.status()).toBe(401);
});

test("unknown routes show a 404 page", async ({ page }) => {
  await login(page, USER);
  await page.goto("/this/does/not/exist");
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("marketplace filters and product detail", async ({ page }) => {
  await login(page, USER);
  await page.goto("/marketplace");
  const fashion = page.getByRole("checkbox", { name: "Fashion" });
  await fashion.click();
  await expect(fashion).toBeChecked();
  await expect(page).toHaveURL(/category=fashion/);
  await page.getByRole("link", { name: /Leather Jacket/ }).click();
  await expect(page.getByRole("heading", { name: "Leather Jacket" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Leather Jacket" })).toBeVisible();
});
