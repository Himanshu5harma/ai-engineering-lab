import { expect, test } from "@playwright/test";

for (const slug of [
  "enterprise-rag-platform",
  "durable-document-ingestion",
  "version-aware-support-assistant",
]) {
  test(`${slug}: diagram, five deliverables, export and saved review readiness`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/design/${slug}`);
    await expect(page.getByTestId("architecture-canvas")).toBeVisible();
    await page.getByRole("tab", { name: "Review", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Mark ready for review" }),
    ).toBeDisabled();
    await page.getByRole("tab", { name: "Diagram", exact: true }).click();
    await page.getByRole("button", { name: "Client", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Component name", exact: true })
      .fill("Support client");
    await page.getByRole("button", { name: "Service", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Component name", exact: true })
      .fill("Policy gateway");
    await page
      .getByRole("textbox", { name: "Component notes", exact: true })
      .fill("Authorize tenant and roles before content exposure.");
    const source = page.getByRole("combobox", { name: "Connection source" });
    const target = page.getByRole("combobox", { name: "Connection target" });
    await source.selectOption({ label: "Support client" });
    await target.selectOption({ label: "Policy gateway" });
    await page
      .getByRole("textbox", { name: "New connection label" })
      .fill("authenticated request");
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
    // Exercise the actual draggable canvas, then verify positions after reload through the API.
    const node = page.locator(".react-flow__node").first();
    const box = await node.boundingBox();
    if (!box) throw new Error("Node has no drawing bounds");
    await page.mouse.move(box.x + 55, box.y + 35);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 85, { steps: 8 });
    await page.mouse.up();
    for (const [tab, label, text] of [
      [
        "Data flow",
        "Request and data flow",
        "Resolve identity → authorize → retrieve permitted evidence → cite sources.",
      ],
      [
        "Capacity",
        "Capacity assumptions",
        "Keep units explicit; calculate workload, peak concurrency and storage overhead.",
      ],
      [
        "Failures",
        "Failure analysis",
        "Policy outage fails closed. Index retries use revision checks and bounded deadlines.",
      ],
      [
        "ADR",
        "Architectural decision record",
        "Choose versioned evidence. Compare per-tenant indexes with scoped shared indexes and revisit at measured scale.",
      ],
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await page.getByRole("textbox", { name: label, exact: true }).fill(text);
    }
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(
      page.getByText("Draft saved in PostgreSQL", { exact: true }),
    ).toBeVisible();
    const beforeReload = await (
      await page.request.get(`/api/v1/designs/${slug}`)
    ).json();
    expect(
      beforeReload.workspace.document.diagram.nodes[0].position.y,
    ).toBeGreaterThan(60);
    expect(
      beforeReload.workspace.document.diagram.nodes[1].data.notes,
    ).toContain("Authorize tenant");
    await page.reload();
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
    await page.getByRole("tab", { name: "ADR", exact: true }).click();
    await expect(
      page.getByRole("textbox", {
        name: "Architectural decision record",
        exact: true,
      }),
    ).toHaveValue(/Choose versioned evidence/);
    await page.getByRole("tab", { name: "Review", exact: true }).click();
    await page
      .getByRole("combobox", { name: /^Self-review:/ })
      .first()
      .selectOption("needs_work");
    await page
      .getByRole("button", { name: "Mark ready for review", exact: true })
      .click();
    await expect(
      page.getByText("Saved and marked ready for engineering review", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/they do not verify architecture quality/),
    ).toBeVisible();
    for (const [name, extension] of [
      ["Export SVG", "svg"],
      ["Export Markdown", "md"],
      ["Export JSON", "json"],
    ]) {
      const event = page.waitForEvent("download");
      await page.getByRole("button", { name, exact: true }).click();
      expect((await event).suggestedFilename()).toMatch(
        new RegExp(`\\.${extension}$`),
      );
    }
    await page.getByRole("link", { name: "All design challenges" }).click();
    await expect(page.locator(".design-card")).toHaveCount(3);
    await expect(
      page.getByText("Ready for review", { exact: true }).first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("conflicting tabs preserve the saved draft and browser backup can restore unsaved work", async ({
  page,
  context,
}) => {
  const slug = "enterprise-rag-platform";
  await page.goto(`/design/${slug}`);
  await page.getByRole("tab", { name: "Data flow", exact: true }).click();
  const other = await context.newPage();
  await other.goto(`/design/${slug}`);
  await other.getByRole("tab", { name: "Data flow", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Request and data flow", exact: true })
    .fill("Winning saved draft");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Draft saved in PostgreSQL", { exact: true }),
  ).toBeVisible();
  await other
    .getByRole("textbox", { name: "Request and data flow", exact: true })
    .fill("Conflicting local changes");
  await other.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(other.getByRole("alert")).toContainText("newer draft");
  await expect(
    other.getByRole("textbox", { name: "Request and data flow", exact: true }),
  ).toHaveValue("Conflicting local changes");
  await expect(
    other.getByRole("button", { name: "Export current changes" }),
  ).toBeVisible();
  await other
    .getByRole("button", { name: "Export and load saved draft", exact: true })
    .click();
  await expect(
    other.getByRole("textbox", { name: "Request and data flow", exact: true }),
  ).toHaveValue("Winning saved draft");
  await other
    .getByRole("textbox", { name: "Request and data flow", exact: true })
    .fill("Recover this unsaved browser draft");
  // SPA navigation leaves a local recovery copy without changing PostgreSQL.
  await other.getByRole("link", { name: "All design challenges" }).click();
  await other.goto(`/design/${slug}`);
  await other.getByText(/browser recovery copy available/).click();
  await other.getByRole("button", { name: "Restore copy", exact: true }).first().click();
  await other.getByRole("tab", { name: "Data flow", exact: true }).click();
  await expect(
    other.getByRole("textbox", { name: "Request and data flow", exact: true }),
  ).toHaveValue("Recover this unsaved browser draft");
  const stored = await (
    await page.request.get(`/api/v1/designs/${slug}`)
  ).json();
  expect(stored.workspace.document.flow).toBe("Winning saved draft");
  await other.close();
});

test("canvas handles create connections and deleting a component removes its connections", async ({
  page,
}) => {
  await page.goto("/design/durable-document-ingestion");
  await page.getByRole("button", { name: "Queue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Component name", exact: true })
    .fill("Ingestion queue");
  await page
    .getByRole("spinbutton", { name: "Component x position" })
    .fill("220");
  await page
    .getByRole("spinbutton", { name: "Component y position" })
    .fill("280");
  const from = page
    .locator(".react-flow__node")
    .filter({ hasText: "Support client" })
    .locator(".react-flow__handle.source");
  const to = page
    .locator(".react-flow__node")
    .filter({ hasText: "Ingestion queue" })
    .locator(".react-flow__handle.target");
  await page.locator(".react-flow__controls-fitview").click();
  await expect(from).toBeInViewport();
  await expect(to).toBeInViewport();
  const a = await from.boundingBox(),
    b = await to.boundingBox();
  if (!a || !b) throw new Error("Connection handles are not visible");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await page.getByRole("combobox",{name:"Connection source"}).selectOption({label:"Ingestion queue"});
  await page.getByRole("combobox",{name:"Connection target"}).selectOption({label:"Policy gateway"});
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Ingestion queue" })
    .click();
  await page
    .getByRole("button", { name: "Delete component", exact: true })
    .click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await expect(page.getByRole("button",{name:"Connect",exact:true})).toBeDisabled();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Draft saved in PostgreSQL", { exact: true }),
  ).toBeVisible();
});

test("design navigation, mobile editing and both themes", async ({ page }) => {
  await page.goto("/design");
  await expect(page.locator(".design-card")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/design-library.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: /Design an enterprise RAG platform/ })
    .click();
  await page.getByRole("tab", { name: "Diagram", exact: true }).click();
  await page.screenshot({
    path: "test-results/design-studio.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/design-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.getByRole("tab", { name: "Scale & limits", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Scale assumptions", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hide brief", exact: true }).click();
  await page.getByRole("tab", { name: "Review", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Engineering self-review" }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "test-results/design-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Curriculum", exact: true }).click();
  await expect(page.locator("#system_design .entry-available")).toHaveCount(3);
  await expect(page.locator("#system_design .entry-planned")).toHaveCount(7);
  await page.locator("#system_design .entry-available a").first().click();
  await expect(page.getByTestId("architecture-canvas")).toBeVisible();
});
