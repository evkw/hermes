import { test, expect } from "@playwright/test";

test("reopen a resolved signal from the detail page via signals table", async ({ page }) => {
  // 1. Create a new signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const signalTitle = `Reopen test ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to inflight and resolve the signal
  await page.getByRole("link", { name: "In-Flight" }).click();
  await expect(page.getByText(signalTitle)).toBeVisible();
  const signalElement = page.locator("[data-signal]").filter({ hasText: signalTitle });
  await signalElement.getByRole("button", { name: "Resolve" }).click();

  // 3. Navigate to Signals table and open the resolved signal
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);

  // 4. Click "Reopen signal" on the detail page
  await page.getByRole("button", { name: "Reopen signal" }).click();

  // 5. Verify the signal appears in the in-flight view again
  await page.getByRole("link", { name: "In-Flight" }).click();
  await expect(page.getByText(signalTitle)).toBeVisible();
});

test("reopen a resolved signal from the detail page", async ({ page }) => {
  // 1. Create and resolve a signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const signalTitle = `Reopen detail ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // Resolve from inflight
  await page.getByRole("link", { name: "In-Flight" }).click();
  const signalElement = page.locator("[data-signal]").filter({ hasText: signalTitle });
  await signalElement.getByRole("button", { name: "Resolve" }).click();

  // 2. Navigate to the signal detail page
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);

  // 3. Click "Reopen signal" on the detail page
  await page.getByRole("button", { name: "Reopen signal" }).click();

  // 4. The "Reopen signal" button should disappear (signal is now active)
  await expect(page.getByRole("button", { name: "Reopen signal" })).not.toBeVisible();

  // 5. Verify a reopened event was created
  await expect(page.getByText("Signal reopened")).toBeVisible();
});

test("reopen button is not visible on active signals", async ({ page }) => {
  // 1. Create a signal (active by default)
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const signalTitle = `Active signal ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Check signals table — no Reopen button on active signal
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await expect(row.getByRole("button", { name: "Reopen" })).not.toBeVisible();

  // 3. Check detail page — no Reopen button
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);
  await expect(page.getByRole("button", { name: "Reopen signal" })).not.toBeVisible();
});

test("resolve a signal from the detail page", async ({ page }) => {
  // 1. Create a signal (active by default)
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const signalTitle = `Resolve detail ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to the signal detail page
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);

  // 3. The "Resolve signal" button should be visible on an active signal
  await expect(page.getByRole("button", { name: "Resolve signal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reopen signal" })).not.toBeVisible();

  // 4. Click "Resolve signal"
  await page.getByRole("button", { name: "Resolve signal" }).click();

  // 5. The button should switch to "Reopen signal"
  await expect(page.getByRole("button", { name: "Reopen signal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve signal" })).not.toBeVisible();

  // 6. Verify a resolved event was created
  await expect(page.getByText("Signal resolved")).toBeVisible();
});

test("round-trip resolve and reopen from the detail page", async ({ page }) => {
  // 1. Create a signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const signalTitle = `Round-trip ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to the signal detail page
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);

  // 3. Resolve from detail page
  await page.getByRole("button", { name: "Resolve signal" }).click();
  await expect(page.getByRole("button", { name: "Reopen signal" })).toBeVisible();

  // 4. Reopen from detail page
  await page.getByRole("button", { name: "Reopen signal" }).click();
  await expect(page.getByRole("button", { name: "Resolve signal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reopen signal" })).not.toBeVisible();

  // 5. Signal should be back in In-Flight
  await page.getByRole("link", { name: "In-Flight" }).click();
  await expect(page.getByText(signalTitle)).toBeVisible();
});
