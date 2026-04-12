import { test, expect } from "@playwright/test";

test("create an origin mapping", async ({ page }) => {
  await page.goto("/settings/origin-mappings");
  await expect(page.getByText("Origin Mappings")).toBeVisible();

  // Empty state
  await expect(page.getByText("No origin mappings yet")).toBeVisible();

  // Open Add dialog
  await page.getByRole("button", { name: "Add your first mapping" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Origin Mapping" })
  ).toBeVisible();

  // Fill form
  await page.getByLabel("Hostname").fill("gitlab.example.com");
  await page.getByLabel("Source Type").fill("gitlab");
  await page.getByLabel("Label").fill("GitLab Link");
  await page.getByRole("button", { name: "Add Mapping" }).click();

  // Dialog closes, mapping visible in table
  await expect(
    page.getByRole("heading", { name: "Add Origin Mapping" })
  ).not.toBeVisible();
  await expect(page.getByText("gitlab.example.com")).toBeVisible();
  await expect(page.getByText("gitlab")).toBeVisible();
  await expect(page.getByText("GitLab Link")).toBeVisible();
});

test("edit an origin mapping", async ({ page }) => {
  await page.goto("/settings/origin-mappings");

  // Create a mapping first
  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Hostname").fill(`edit-test-${Date.now()}.example.com`);
  await page.getByLabel("Source Type").fill("custom");
  await page.getByRole("button", { name: "Add Mapping" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Origin Mapping" })
  ).not.toBeVisible();

  // Edit the mapping
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Edit Mapping" })
  ).toBeVisible();

  await page.getByLabel("Source Type").clear();
  await page.getByLabel("Source Type").fill("jira");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(
    page.getByRole("heading", { name: "Edit Mapping" })
  ).not.toBeVisible();
  await expect(page.getByText("jira").first()).toBeVisible();
});

test("delete an origin mapping", async ({ page }) => {
  await page.goto("/settings/origin-mappings");

  // Create a mapping first
  const hostname = `delete-test-${Date.now()}.example.com`;
  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Hostname").fill(hostname);
  await page.getByLabel("Source Type").fill("notion");
  await page.getByRole("button", { name: "Add Mapping" }).click();
  await expect(page.getByText(hostname)).toBeVisible();

  // Delete it
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Delete Mapping" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Delete Mapping" })
  ).not.toBeVisible();
});

test("duplicate hostname is rejected", async ({ page }) => {
  await page.goto("/settings/origin-mappings");
  const hostname = `dup-${Date.now()}.example.com`;

  // Create first mapping
  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Hostname").fill(hostname);
  await page.getByLabel("Source Type").fill("gitlab");
  await page.getByRole("button", { name: "Add Mapping" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Origin Mapping" })
  ).not.toBeVisible();

  // Attempt duplicate
  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Hostname").fill(hostname);
  await page.getByLabel("Source Type").fill("jira");
  await page.getByRole("button", { name: "Add Mapping" }).click();

  await expect(page.getByText("already exists")).toBeVisible();
});

test("source auto-detection uses configured mapping", async ({ page }) => {
  // Create a mapping for a test hostname
  await page.goto("/settings/origin-mappings");
  const hostname = `mapped-${Date.now()}.example.com`;

  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Hostname").fill(hostname);
  await page.getByLabel("Source Type").fill("figma");
  await page.getByLabel("Label").fill("Figma Design");
  await page.getByRole("button", { name: "Add Mapping" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Origin Mapping" })
  ).not.toBeVisible();

  // Create a signal and add a source with the mapped URL
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  const title = `Mapping test ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(
    page.getByRole("heading", { name: "New Signal" })
  ).not.toBeVisible();

  // Navigate to signal detail
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await row.click();
  await expect(page.locator("h1")).toContainText(title);

  // Add a source with the mapped hostname
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill(`https://${hostname}/design/123`);
  await page.getByRole("button", { name: "Add Source" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Source" })
  ).not.toBeVisible();

  // Source should use the mapped type and label
  await expect(page.getByText("Figma Design")).toBeVisible();
  await expect(page.getByText("Figma")).toBeVisible();
});

test("settings navigation works", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL("/settings/origin-mappings");
  await expect(page.getByText("Origin Mappings")).toBeVisible();
});
