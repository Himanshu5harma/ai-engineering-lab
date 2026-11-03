import { devices, expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function openEditor(page: Page) {
  await page.goto("/arena/safe-cosine-similarity");
  const editor = page.getByRole("textbox", {
    name: "Python solution editor",
    exact: true,
  });
  await expect(editor).toBeVisible();
  const challenge = await (
    await page.request.get("/api/v1/challenges/safe-cosine-similarity")
  ).json();
  const modifier = await page.evaluate(() =>
    navigator.userAgent.includes("Macintosh") ? "Meta" : "Control",
  );
  return {
    editor,
    challenge,
    modifier,
    key: `ael-draft:${challenge.version_id}`,
  };
}

const draft = (page: Page, key: string) =>
  page.evaluate((key) => localStorage.getItem(key), key);

async function paste(page: Page, text: string) {
  const editor = page.getByRole("textbox", {
    name: "Python solution editor",
    exact: true,
  });
  const modifier = await page.evaluate(() =>
    navigator.userAgent.includes("Macintosh") ? "Meta" : "Control",
  );
  await editor.press(`${modifier}+A`);
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
  }, text);
}

test("typing, indentation and mouse placement stay aligned across font sizes", async ({
  page,
}) => {
  const { editor, key, modifier } = await openEditor(page);
  await editor.press(`${modifier}+A`);
  await page.keyboard.type("def probe(x):");
  await page.keyboard.press("Enter");
  await page.keyboard.type("return x + 1");
  await expect
    .poll(() => draft(page, key))
    .toBe("def probe(x):\n    return x + 1");

  for (const size of [12, 15, 24]) {
    await page
      .getByRole("combobox", { name: "Code font size" })
      .selectOption(String(size));
    await expect(page.locator(".view-lines")).toHaveCSS(
      "font-size",
      `${size}px`,
    );
    await paste(page, "probe = 12345\n");
    await editor.press(modifier === "Meta" ? "Meta+ArrowUp" : "Control+Home");
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.type("_keyboard");
    await expect.poll(() => draft(page, key)).toBe("probe_keyboard = 12345\n");
    await paste(page, "probe = 12345\n");
    await expect(page.locator(".view-line").first()).toHaveText(
      "probe = 12345",
    );
    // Monaco replaces line nodes after edits/font changes. Measure the live DOM
    // atomically, then let locator.click wait for a stable, clickable line.
    const glyphHandle = await page.waitForFunction(() => {
      const line = document.querySelector(".view-line");
      if (!line) return null;
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let remaining = 5;
      while (node && remaining > (node.textContent?.length || 0)) {
        remaining -= node.textContent?.length || 0;
        node = walker.nextNode();
      }
      if (!node) return null;
      const range = document.createRange();
      range.setStart(line, 0);
      range.setEnd(node, remaining);
      const rect = range.getBoundingClientRect();
      const bounds = line.getBoundingClientRect();
      if (!rect.width || !rect.height || !bounds.width) return null;
      return {
        x: rect.right - bounds.left + 0.5,
        y: rect.y + rect.height / 2 - bounds.top,
      };
    });
    const glyph = await glyphHandle.jsonValue();
    await glyphHandle.dispose();
    if (!glyph) throw new Error("Editor text did not render");
    await page.locator(".view-line").first().click({ position: glyph });
    await page.keyboard.type("_checked");
    await expect.poll(() => draft(page, key)).toBe("probe_checked = 12345\n");
  }
});

test("Reset cancellation preserves edits and confirmed Reset survives reload", async ({
  page,
}) => {
  const { challenge, key } = await openEditor(page);
  const local = "# Keep this unsaved solution\n";
  await paste(page, local);
  await expect.poll(() => draft(page, key)).toBe(local);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reset to starter code" }).click();
  await expect.poll(() => draft(page, key)).toBe(local);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset to starter code" }).click();
  await expect.poll(() => draft(page, key)).toBe(challenge.starter_code);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Python solution editor", exact: true }),
  ).toBeVisible();
  await expect.poll(() => draft(page, key)).toBe(challenge.starter_code);
});

test("execution shortcuts open results and history restoration protects current edits", async ({
  page,
}) => {
  const { editor, challenge, key, modifier } = await openEditor(page);
  const reference = readFileSync(
    resolve(
      "../../content/challenges/safe-cosine-similarity/reference_solution.py",
    ),
    "utf8",
  );
  await paste(page, reference);
  await expect.poll(() => draft(page, key)).toBe(reference);
  await expect(
    page.getByRole("button", { name: "Run tests", exact: true }),
  ).toBeEnabled();
  await editor.press(`${modifier}+Enter`);
  await expect(page.locator(".run-notice")).toContainText(
    "Public tests passed",
    { timeout: 20000 },
  );
  await expect.poll(() => draft(page, key)).toBe(reference);
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Collapse test results" }).click();
  await editor.press(`${modifier}+Shift+Enter`);
  await expect(page.locator(".results-scroll")).toBeVisible();
  await expect(page.locator(".result-heading")).toContainText(
    "FULL VERIFICATION",
  );
  await expect(page.locator(".result-heading")).toContainText("passed", {
    timeout: 20000,
  });
  await expect.poll(() => draft(page, key)).toBe(reference);
  const hidden = page.locator(".test-case").nth(challenge.public_count);
  await hidden.locator("summary").click();
  await expect(hidden).toContainText("Inputs and outputs stay private");
  await expect(hidden.locator("pre")).toHaveCount(0);

  const local = "# Keep this newer draft until I confirm\n";
  await paste(page, local);
  await page.getByRole("tab", { name: "History", exact: true }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Restore code", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("tab", { name: "Test results", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect.poll(() => draft(page, key)).toBe(local);
  await page.getByRole("tab", { name: "History", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restore code", exact: true })
    .first()
    .click();
  await expect.poll(() => draft(page, key)).toBe(reference);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Python solution editor", exact: true }),
  ).toBeVisible();
  await expect.poll(() => draft(page, key)).toBe(reference);
});

for (const platform of ["Windows", "Mac"] as const) {
  test.describe(`${platform} Find/Replace`, () => {
    if (platform === "Mac") {
      test.use({
        userAgent: devices["Desktop Chrome"].userAgent.replace(
          /\([^)]*\)/,
          "(Macintosh; Intel Mac OS X 10_15_7)",
        ),
      });
    }
    test("Replace All edits the draft without queuing execution", async ({
      page,
    }) => {
      const { editor, key, modifier } = await openEditor(page);
      const source = "alpha = 1\nbeta = alpha\n";
      await paste(page, source);
      await expect.poll(() => draft(page, key)).toBe(source);
      await expect(
        page.getByRole("button", { name: "Run tests", exact: true }),
      ).toBeEnabled();
      let executions = 0;
      await page.route("**/api/v1/submissions", async (route) => {
        if (route.request().method() === "POST") {
          executions++;
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              error: {
                code: "unexpected_execution",
                message: "Find/Replace must not run code",
              },
            }),
          });
        } else await route.continue();
      });
      await editor.press(`${modifier}+f`);
      const find = page.getByRole("dialog", {
        name: "Find / Replace",
        exact: true,
      });
      await expect(find).toBeVisible();
      const iconFonts = await page.evaluate(async () =>
        (await document.fonts.load("16px codicon")).map((font) => ({
          family: font.family,
          status: font.status,
        })),
      );
      expect(
        iconFonts.some(
          (font) => font.family.includes("codicon") && font.status === "loaded",
        ),
      ).toBe(true);
      await find
        .getByRole("textbox", { name: "Find", exact: true })
        .fill("alpha");
      await find
        .getByRole("button", { name: "Toggle Replace", exact: true })
        .click();
      const replacement = find.getByRole("textbox", {
        name: "Replace",
        exact: true,
      });
      await replacement.fill("omega");
      await replacement.press(
        modifier === "Meta" ? "Meta+Enter" : "Control+Alt+Enter",
      );
      await expect
        .poll(() => draft(page, key))
        .toBe("omega = 1\nbeta = omega\n");
      expect(executions).toBe(0);
      await replacement.press("Escape");
      await expect(find).not.toBeVisible();
    });
  });
}
