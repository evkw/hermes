import { test, expect } from "@playwright/test";

test.describe("streams settings", () => {
  test("create a stream", async ({ page }) => {
    await page.goto("/settings/streams");
    await expect(page.getByRole("heading", { name: "Streams" })).toBeVisible();

    // Open Add dialog via the trigger
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await expect(
      page.getByRole("heading", { name: "Add Stream" })
    ).toBeVisible();

    // Fill form — key should auto-generate from name
    const ts = Date.now();
    await page.getByLabel("Name").fill(`Work ${ts}`);
    await expect(page.getByLabel("Key")).toHaveValue(`work-${ts}`);

    // Submit inside dialog (getByRole respects inert, so only dialog submit matches)
    await page.getByRole("button", { name: "Add Stream" }).click();

    // Dialog closes, stream visible in table
    await expect(
      page.getByRole("heading", { name: "Add Stream" })
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: `work-${ts}`, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: `Work ${ts}`, exact: true })).toBeVisible();
  });

  test("edit a stream", async ({ page }) => {
    await page.goto("/settings/streams");

    // Create a stream first
    const ts = Date.now();
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await page.getByLabel("Name").fill(`Edit ${ts}`);
    await page.getByRole("button", { name: "Add Stream" }).click();
    await expect(
      page.getByRole("heading", { name: "Add Stream" })
    ).not.toBeVisible();

    // Edit the stream
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Edit Stream" })
    ).toBeVisible();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(`Updated ${ts}`);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit Stream" })
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: `Updated ${ts}`, exact: true })).toBeVisible();
  });

  test("delete a stream", async ({ page }) => {
    await page.goto("/settings/streams");

    // Create a stream first
    const ts = Date.now();
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await page.getByLabel("Name").fill(`Delete ${ts}`);
    await page.getByRole("button", { name: "Add Stream" }).click();
    await expect(page.getByText(`Delete ${ts}`)).toBeVisible();

    // Delete it
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Delete Stream" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("heading", { name: "Delete Stream" })
    ).not.toBeVisible();
  });

  test("prevents duplicate keys", async ({ page }) => {
    await page.goto("/settings/streams");

    const ts = Date.now();

    // Create first stream
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await page.getByLabel("Name").fill(`Unique ${ts}`);
    await page.getByRole("button", { name: "Add Stream" }).click();
    await expect(
      page.getByRole("heading", { name: "Add Stream" })
    ).not.toBeVisible();

    // Try to create duplicate
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await page.getByLabel("Name").fill(`Unique ${ts}`);
    await page.getByRole("button", { name: "Add Stream" }).click();

    // Should show error
    await expect(
      page.getByText("A stream with this key already exists")
    ).toBeVisible();
  });
});

test.describe("streams on signals", () => {
  test("create a signal with streams and see them on the detail page", async ({ page }) => {
    // First, create a stream
    await page.goto("/settings/streams");
    const ts = Date.now();
    await page.getByRole("button", { name: /add.*stream/i }).first().click();
    await page.getByLabel("Name").fill(`Project ${ts}`);
    await page.getByRole("button", { name: "Add Stream" }).click();
    await expect(
      page.getByRole("heading", { name: "Add Stream" })
    ).not.toBeVisible();

    // Create a signal with the stream selected
    await page.getByRole("button", { name: "New Signal" }).click();
    await expect(
      page.getByRole("heading", { name: "New Signal" })
    ).toBeVisible();

    await page.getByLabel("Title").fill(`Stream test signal ${ts}`);

    // Select the stream badge
    await page.getByRole("button", { name: `Project ${ts}` }).click();
    await page.getByRole("button", { name: "Create Signal" }).click();

    await expect(
      page.getByRole("heading", { name: "New Signal" })
    ).not.toBeVisible();

    // Navigate to signals page, search for our signal
    await page.getByRole("link", { name: "Signals" }).click();
    await page.getByPlaceholder("Search signals").fill(`Stream test signal ${ts}`);
    await expect(page.getByText(`Stream test signal ${ts}`)).toBeVisible();

    // Click through to detail page
    await page.getByText(`Stream test signal ${ts}`).click();

    // On detail page, stream badge should be visible (use .first() since stream filter also shows the badge)
    await expect(page.getByText(`Project ${ts}`).first()).toBeVisible();
  });
});
