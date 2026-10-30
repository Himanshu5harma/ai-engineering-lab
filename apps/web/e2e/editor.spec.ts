import { expect, test, type Page } from "@playwright/test";

async function paste(page: Page, code: string) {
  const editor = page.getByRole("textbox", {
    name: "Python solution editor",
    exact: true,
  });
  await editor.focus();
  const modifier = await page.evaluate(() =>
    navigator.userAgent.includes("Macintosh") ? "Meta" : "Control",
  );
  await page.keyboard.press(`${modifier}+A`);
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
async function draft(page: Page) {
  const challenge = await (
    await page.request.get("/api/v1/challenges/safe-cosine-similarity")
  ).json();
  return page.evaluate(
    (key) => localStorage.getItem(key),
    `ael-draft:${challenge.version_id}`,
  );
}

test("minimal toolbar formats locally and keeps undo, find and syntax failures safe", async ({
  page,
}) => {
  const errors: string[] = [];
  const wasmRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("ruff_wasm_bg"))
      wasmRequests.push(request.url());
  });
  await page.goto("/arena/safe-cosine-similarity");
  const toolbar = page.getByRole("toolbar", { name: "Python editor tools" });
  await expect(toolbar.getByRole("button")).toHaveCount(2);
  await expect(
    toolbar.getByRole("combobox", { name: "Code font size" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Format code", exact: true }),
  ).toBeEnabled();
  const raw = "def add( a,b ):\n return a+b\n";
  await paste(page, raw);
  await expect.poll(() => draft(page)).toBe(raw);
  expect(wasmRequests).toHaveLength(0);
  await page.getByRole("button", { name: "Format code", exact: true }).click();
  await expect(page.getByText("Code formatted", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect
    .poll(() => draft(page))
    .toBe("def add(a, b):\n    return a + b\n");
  expect(wasmRequests.length).toBeGreaterThan(0);
  const modifier = await page.evaluate(() =>
    navigator.userAgent.includes("Macintosh") ? "Meta" : "Control",
  );
  await page.keyboard.press(`${modifier}+z`);
  await expect.poll(() => draft(page)).toBe(raw);
  await page.keyboard.press(modifier === "Meta" ? "Meta+Shift+z" : "Control+y");
  await expect.poll(() => draft(page)).toContain("return a + b");
  await paste(page, raw);
  await page.keyboard.press("Alt+Shift+F");
  await expect
    .poll(() => draft(page))
    .toBe("def add(a, b):\n    return a + b\n");
  await page.keyboard.press(`${modifier}+f`);
  await expect(page.locator(".find-widget")).toBeVisible();
  await page.keyboard.press("Escape");
  await paste(page, "def broken(:\n    return 1\n");
  await page.getByRole("button", { name: "Format code", exact: true }).click();
  await expect(page.locator(".editor-notice")).toContainText(
    "Could not format:",
  );
  await expect.poll(() => draft(page)).toBe("def broken(:\n    return 1\n");
  await expect(
    page.locator(
      ".python-problems, .python-statusbar, .editor-dialog, .monaco-diff-editor",
    ),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("fullscreen, editor focus and accessible panel resizing create more code space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/arena/safe-cosine-similarity");
  await expect(
    page.getByRole("textbox", { name: "Python solution editor", exact: true }),
  ).toBeVisible();
  const initial = await page.locator(".editor-container").boundingBox();
  expect(initial!.height).toBeGreaterThan(350);
  const vertical = page.getByRole("separator", {
    name: "Resize problem panel",
  });
  await vertical.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(vertical).toHaveAttribute("aria-valuenow", "32");
  const wider = await page.locator(".editor-container").boundingBox();
  expect(wider!.width).toBeGreaterThan(initial!.width);
  await expect(page.locator(".results-scroll")).toBeVisible();
  const horizontal = page.getByRole("separator", {
    name: "Resize test results",
  });
  const size = Number(await horizontal.getAttribute("aria-valuenow"));
  await horizontal.focus();
  await page.keyboard.press("ArrowUp");
  await expect(horizontal).toHaveAttribute("aria-valuenow", String(size + 20));
  await page
    .getByRole("button", { name: "Collapse test results", exact: true })
    .click();
  await page.getByRole("button", { name: "Focus editor", exact: true }).click();
  await expect(page.locator(".problem-panel")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Enter fullscreen workspace", exact: true })
    .click();
  await expect(page.locator(".arena-page")).toHaveClass(/arena-expanded/);
  const full = await page.locator(".arena-page").boundingBox();
  expect(full!.height).toBe(960);
  expect(full!.width).toBe(1440);
  await page.screenshot({
    path: "test-results/editor-fullscreen.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator(".arena-page")).not.toHaveClass(/arena-expanded/);
  await page.getByRole("button", { name: "Show problem", exact: true }).click();
  await expect(page.locator(".problem-panel")).toBeVisible();
});

test("font size survives reload, theme follows the app, and mobile stays focused", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("ael-editor-preferences-v1"))
      localStorage.setItem(
        "ael-editor-preferences-v1",
        JSON.stringify({
          fontSize: 18,
          minimap: true,
          theme: "midnight",
          wordWrap: false,
        }),
      );
  });
  await page.goto("/arena/safe-cosine-similarity");
  const font = page.getByRole("combobox", {
    name: "Code font size",
    exact: true,
  });
  await expect(font).toHaveValue("18");
  await expect(page.locator(".python-editor-shell")).toHaveAttribute(
    "data-editor-theme",
    "ael-paper",
  );
  await expect(page.locator(".minimap")).not.toBeVisible();
  await paste(page, "def saved_draft():\n    return 42\n");
  await font.selectOption("16");
  await page.reload();
  await expect(font).toHaveValue("16");
  await expect
    .poll(() => draft(page))
    .toBe("def saved_draft():\n    return 42\n");
  await page.screenshot({
    path: "test-results/editor-simple-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator(".python-editor-shell")).toHaveAttribute(
    "data-editor-theme",
    "ael-midnight",
  );
  await page.screenshot({
    path: "test-results/editor-simple-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await expect(
    page.getByRole("textbox", { name: "Python solution editor", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Problem", exact: true }).click();
  await expect(page.locator(".problem-panel")).toBeVisible();
  await expect(page.locator(".code-panel")).not.toBeVisible();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await expect(page.locator(".code-panel")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Format code", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/editor-simple-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("a delayed formatter cannot replace newer typing", async ({
  page,
  context,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route(/ruff_wasm_bg.*\.wasm/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/arena/safe-cosine-similarity");
  await paste(page, "def old( a,b ):\n return a+b\n");
  await page.getByRole("button", { name: "Format code", exact: true }).click();
  await expect(page.locator(".format-tool")).toContainText("Formatting…");
  await paste(page, "def latest_edit():\n    return 'preserve me'\n");
  release();
  await expect(page.locator(".editor-notice")).toContainText(
    "Kept your latest edits",
    { timeout: 20000 },
  );
  await expect
    .poll(() => draft(page))
    .toBe("def latest_edit():\n    return 'preserve me'\n");
});
