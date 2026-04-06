import { test, expect } from "@playwright/test";

test("homepage shows Morning Brief heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Morning Brief");
});

test("top nav links are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Hermes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "In Flight" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Signals" })).toBeVisible();
});

test("navigate to Signals page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await expect(page.locator("h1")).toContainText("All Signals");
});

test("navigate to In Flight page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "In Flight" }).click();
  await expect(page).toHaveURL("/inflight");
});
