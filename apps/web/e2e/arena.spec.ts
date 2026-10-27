import { expect, test, type Page, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function pasteCode(page: Page, editor: Locator, code: string) {
  const modifier = await page.evaluate(() =>
    navigator.userAgent.includes("Macintosh") ? "Meta" : "Control",
  );
  await editor.focus();
  await page.keyboard.press(`${modifier}+A`);
  // Dispatch an actual paste event; insertText types line-by-line and triggers auto-indent.
  await editor.evaluate((element, text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, code);
}

// Uses the real API, PostgreSQL, host worker, and ephemeral containers. No API mocks.
for (const slug of [
  "safe-cosine-similarity",
  "top-k-vector-search",
  "token-window-chunking",
  "structure-aware-chunking",
  "version-aware-evidence-filter",
  "reciprocal-rank-fusion",
  "context-budget-allocator",
  "precision-recall-at-k",
  "mrr-ndcg-evaluation",
  "citation-reference-verification",
  "exponential-backoff-jitter",
  "permission-aware-tool-registry",
]) {
  test(`${slug}: incorrect run, correct run, full submit and persisted history`, async ({
    page,
  }) => {
    await page.goto(`/arena/${slug}`);
    const editor = page.getByRole("textbox", {
      name: "Python solution editor",
    });
    await expect(editor).toBeVisible();
    await expect(page.getByRole("button", { name: "Run tests" })).toBeEnabled();
    const starter = readFileSync(
      resolve("../../content/challenges", slug, "starter.py"),
      "utf8",
    );
    await pasteCode(page, editor, starter);
    await page.getByRole("button", { name: "Run tests" }).click();
    await expect(page.locator(".result-heading")).toContainText("failed", {
      timeout: 20000,
    });
    await expect(page.locator(".test-fail")).not.toHaveCount(0);
    await page.locator(".test-fail summary").first().click();
    await expect(
      page.getByText("Actual", { exact: true }).first(),
    ).toBeVisible();
    const reference = readFileSync(
      resolve("../../content/challenges", slug, "reference_solution.py"),
      "utf8",
    );
    await pasteCode(page, editor, reference);
    await page.getByRole("button", { name: "Run tests" }).click();
    await expect(
      page.getByText(/Public tests passed. Submit to verify/),
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.locator(".result-heading")).toContainText(
      "FULL VERIFICATION",
    );
    await expect(page.locator(".result-heading")).toContainText("passed", {
      timeout: 20000,
    });
    await page.getByRole("tab", { name: "History", exact: true }).click();
    await expect(page.locator(".history-list")).toContainText("Submit");
    // SPA revisits preserve local draft and retrieve permanent history.
    await page.getByRole("link", { name: /All challenges/ }).click();
    await page.locator(`a[href="/arena/${slug}"]`).first().click();
    await expect(editor).toBeVisible();
    await page.getByRole("tab", { name: "History", exact: true }).click();
    await expect(page.locator(".history-list")).toContainText("passed");
    await page.screenshot({ path: `test-results/${slug}.png`, fullPage: true });
  });
}

test("catalog navigation, filtering and theme", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Verified challenges")).toBeVisible();
  await page.screenshot({
    path: "test-results/minimal-overview.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Coding Arena", exact: true }).click();
  await page.screenshot({
    path: "test-results/workbench-catalog.png",
    fullPage: true,
  });
  await page
    .getByRole("combobox", { name: "Filter by difficulty" })
    .selectOption("Foundation");
  await expect(page.locator(".challenge-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learn by building." }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "test-results/minimal-mobile.png",
    fullPage: true,
  });
});

test("saved challenges, global search and engineering notes survive revisits", async ({
  page,
}) => {
  await page.goto("/arena");
  await page
    .getByRole("button", {
      name: "Save Cosine similarity, without surprises",
      exact: true,
    })
    .click();
  await page
    .locator(".catalog-tabs")
    .getByRole("button", { name: /Saved/ })
    .click();
  await expect(page.locator(".challenge-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".challenge-card")).toHaveCount(1);
  await page.keyboard.press("Control+k");
  const search = page.getByRole("textbox", {
    name: "Search all challenge content",
  });
  await expect(search).toBeVisible();
  await search.fill("cosine");
  await search.press("Enter");
  await expect(page.locator(".arena-heading h1")).toContainText(
    "Cosine similarity, without surprises",
  );
  await page.getByRole("tab", { name: "Notes", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Engineering notes" })
    .fill(
      "Scale vectors before computing norms. Validate before the zero shortcut.",
    );
  await expect(page.getByRole("status")).toHaveText("Saved in this browser");
  await page.reload();
  await page.getByRole("tab", { name: "Notes", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Engineering notes" }),
  ).toHaveValue(/Scale vectors/);
  await page
    .getByRole("button", { name: "Unsave this challenge", exact: true })
    .click();
  await page.getByRole("link", { name: "Coding Arena", exact: true }).click();
  await page
    .locator(".catalog-tabs")
    .getByRole("button", { name: /Saved/ })
    .click();
  await expect(page.getByText("Keep a challenge for later")).toBeVisible();
});

test("execution inspection, source export and learning progress use real evidence", async ({
  page,
}) => {
  await page.goto("/activity");
  await expect(page.locator(".history-table")).toBeVisible();
  await page.screenshot({
    path: "test-results/workbench-activity.png",
    fullPage: true,
  });
  await page.locator(".history-challenge-link").first().click();
  const dialog = page.locator(".execution-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".result-heading")).toContainText("passed");
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Export Python" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.py$/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("link", { name: "Progress", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learning tracks" }),
  ).toBeVisible();
  await expect(page.locator(".learning-steps li")).toHaveCount(12);
  await expect(page.locator(".first-release-steps li")).toHaveCount(12);
  await page.screenshot({
    path: "test-results/workbench-progress.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page.locator(".history-table")).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});

test("first-twelve order, planned curriculum and independent engineering review", async ({
  page,
}) => {
  await page.goto("/progress");
  await expect(page.locator(".first-release-steps li")).toHaveCount(12);
  expect(
    await page
      .locator(".first-release-steps .curriculum-code")
      .allTextContents(),
  ).toEqual([
    "R01",
    "R02",
    "R04",
    "R05",
    "R08",
    "R09",
    "G03",
    "E01",
    "E02",
    "G06",
    "P03",
    "A02",
  ]);
  await page.getByRole("link", { name: "Curriculum", exact: true }).click();
  await expect(page.getByText(/12 ready now.*88 planned/)).toBeVisible();
  await expect(page.locator("#system_design .entry-planned")).toHaveCount(10);
  await expect(page.locator("#labs .entry-planned")).toHaveCount(6);
  await expect(page.locator("#debugging .entry-planned")).toHaveCount(8);
  const reviewURL = "/api/v1/challenges/version-aware-evidence-filter/review";
  const previous = await (await page.request.get(reviewURL)).json();
  try {
    await page.goto("/arena/version-aware-evidence-filter?tab=review");
    const checkbox = page.getByRole("checkbox", {
      name: /Performance and complexity/,
    });
    await checkbox.check();
    await page
      .getByRole("textbox", {
        name: "Reasoning, evidence, and remaining questions",
      })
      .fill("Verification-only review draft; restored after this test.");
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByText("Review saved in PostgreSQL")).toBeVisible();
    await page.reload();
    await expect(checkbox).toBeChecked();
    await expect(
      page.getByRole("textbox", {
        name: "Reasoning, evidence, and remaining questions",
      }),
    ).toHaveValue("Verification-only review draft; restored after this test.");
    await expect(
      page.getByText(/these checkboxes do not certify mastery/),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/engineering-review.png",
      fullPage: true,
    });
  } finally {
    const response = await page.request.post(reviewURL, {
      data: {
        version_id: previous.version_id,
        completed_tasks: previous.completed_tasks,
        notes: previous.notes,
      },
    });
    expect(response.ok()).toBeTruthy();
  }
});
