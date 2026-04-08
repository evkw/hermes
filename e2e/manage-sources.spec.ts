import { test, expect } from "@playwright/test";

// Helper: create a signal and navigate to its detail page
async function createSignalAndGoToDetail(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // Navigate to Signals table, then click into the signal detail
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  const row = page.getByRole("row").filter({ hasText: title });
  await row.click();
  await expect(page.locator("h1")).toContainText(title);
}

test("add a source to an existing signal", async ({ page }) => {
  const title = `Source test ${Date.now()}`;
  await createSignalAndGoToDetail(page, title);

  // Empty state visible
  await expect(page.getByText("No sources attached.")).toBeVisible();

  // Open Add Source dialog — only URL field shown
  await page.getByRole("button", { name: "Add source" }).click();
  await expect(page.getByRole("heading", { name: "Add Source" })).toBeVisible();

  // Fill URL — type and label are auto-detected
  await page.getByLabel("Source URL").fill("https://lfmsco.atlassian.net/browse/HERMES-42");
  await page.getByRole("button", { name: "Add Source" }).click();

  // Dialog closes, auto-detected source appears
  await expect(page.getByRole("heading", { name: "Add Source" })).not.toBeVisible();
  await expect(page.getByText("Jira Link")).toBeVisible();
  await expect(page.getByText("Jira")).toBeVisible();

  // Verify source_added event in events table
  await expect(page.getByText("source_added").first()).toBeVisible();
});

test("edit a source", async ({ page }) => {
  const title = `Edit source ${Date.now()}`;
  await createSignalAndGoToDetail(page, title);

  // Add a source first (URL only)
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill("https://gitlab.lfms.example.com/project/-/merge_requests/99");
  await page.getByRole("button", { name: "Add Source" }).click();
  await expect(page.getByRole("heading", { name: "Add Source" })).not.toBeVisible();
  await expect(page.getByText("GitLab Link")).toBeVisible();

  // Edit it — all fields visible in edit mode
  await page.getByRole("button", { name: "Edit GitLab Link" }).click();
  await expect(page.getByRole("heading", { name: "Edit Source" })).toBeVisible();

  await page.getByLabel("Label").clear();
  await page.getByLabel("Label").fill("Auth refactor MR");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(page.getByRole("heading", { name: "Edit Source" })).not.toBeVisible();
  await expect(page.getByText("Auth refactor MR")).toBeVisible();
  await expect(page.getByText("GitLab Link")).not.toBeVisible();
});

test("delete a source without deleting the signal", async ({ page }) => {
  const title = `Delete source ${Date.now()}`;
  await createSignalAndGoToDetail(page, title);

  // Add a source
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill("https://teams.microsoft.com/thread/123");
  await page.getByRole("button", { name: "Add Source" }).click();
  await expect(page.getByText("Teams Link")).toBeVisible();

  // Delete it
  await page.getByRole("button", { name: "Delete Teams Link" }).click();
  await expect(page.getByRole("heading", { name: "Delete Source" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();

  // Source gone, signal still there
  await expect(page.getByRole("heading", { name: "Delete Source" })).not.toBeVisible();
  await expect(page.getByText("Teams Link")).not.toBeVisible();
  await expect(page.getByText("No sources attached.")).toBeVisible();
  await expect(page.locator("h1")).toContainText(title);

  // Verify source_removed event
  await expect(page.getByText("source_removed").first()).toBeVisible();
});

test("invalid URL is rejected with clear feedback", async ({ page }) => {
  const title = `URL validation ${Date.now()}`;
  await createSignalAndGoToDetail(page, title);

  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill("not-a-url");
  await page.getByRole("button", { name: "Add Source" }).click();

  await expect(page.getByText("Invalid URL")).toBeVisible();
});

test("multiple sources can be attached to one signal", async ({ page }) => {
  const title = `Multi source ${Date.now()}`;
  await createSignalAndGoToDetail(page, title);

  // Add first source
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill("https://lfmsco.atlassian.net/browse/HERMES-1");
  await page.getByRole("button", { name: "Add Source" }).click();
  await expect(page.getByRole("heading", { name: "Add Source" })).not.toBeVisible();

  // Add second source
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Source URL").fill("https://teams.microsoft.com/thread/456");
  await page.getByRole("button", { name: "Add Source" }).click();
  await expect(page.getByRole("heading", { name: "Add Source" })).not.toBeVisible();

  // Both visible
  await expect(page.getByText("Jira Link")).toBeVisible();
  await expect(page.getByText("Teams Link")).toBeVisible();
});
