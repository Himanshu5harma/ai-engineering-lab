import { expect, test } from "@playwright/test";

test("annotated challenge header aligns and output remains visible within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1477, height: 871 });
  await page.goto("/arena/top-k-vector-search");
  await expect(
    page.getByRole("textbox", { name: "Python solution editor", exact: true }),
  ).toBeVisible();
  const output = page.locator(".results-scroll");
  await expect(output).toBeVisible();
  const resultBounds = await page.locator(".results-panel").boundingBox();
  expect(resultBounds!.height).toBeGreaterThanOrEqual(100);
  expect(resultBounds!.y + resultBounds!.height).toBeLessThanOrEqual(871);
  const title = await page.locator(".arena-heading-title").boundingBox();
  const actions = await page.locator(".workspace-view-controls").boundingBox();
  const problem = await page.locator(".problem-panel").boundingBox();
  expect(Math.abs(title!.x - problem!.x)).toBeLessThan(2);
  expect(title!.x + title!.width).toBeLessThan(actions!.x);
  const centers = await page
    .locator(".workspace-view-controls > button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return box.y + box.height / 2;
      }),
    );
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(2);
  await expect(
    page.getByRole("button", { name: "Collapse test results" }),
  ).toContainText("Hide output");
  await page.screenshot({
    path: "test-results/layout-arena.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Collapse test results" }).click();
  await expect(output).not.toBeVisible();
  await page.getByRole("button", { name: "Expand test results" }).click();
  await expect(output).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await expect(output).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await page.locator(".results-panel").boundingBox();
      return bounds!.y + bounds!.height;
    })
    .toBeLessThanOrEqual(844);
  await page.screenshot({
    path: "test-results/layout-arena-mobile.png",
    fullPage: true,
  });
});

test("site sections share gutters and responsive grids across desktop and mobile", async ({
  page,
}) => {
  const routes = [
    ["/", ".overview-metrics", "overview"],
    ["/arena", ".catalog-layout", "catalog"],
    ["/activity", ".history-section-heading", "activity"],
    ["/progress", ".progress-summary", "progress"],
    ["/curriculum", ".curriculum-guidance", "curriculum"],
    ["/design", ".design-intro", "design"],
  ];
  let desktopLeft = -1;
  for (const width of [1477, 390]) {
    await page.setViewportSize({ width, height: 871 });
    for (const [route, section, name] of routes) {
      await page.goto(route);
      const heading = page.locator(".page > .page-heading h1");
      await expect(heading).toBeVisible();
      await expect(page.locator(section)).toBeVisible();
      await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
      const headingBounds = await heading.boundingBox();
      const sectionBounds = await page.locator(section).boundingBox();
      expect(Math.abs(headingBounds!.x - sectionBounds!.x)).toBeLessThan(2);
      if (width === 1477) {
        if (desktopLeft < 0) desktopLeft = headingBounds!.x;
        expect(Math.abs(headingBounds!.x - desktopLeft)).toBeLessThan(2);
      }
      if (route === "/design" && width === 1477) {
        const bottoms = await page
          .locator(".design-card > .button")
          .evaluateAll((buttons) =>
            buttons.map((button) => button.getBoundingClientRect().bottom),
          );
        expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(2);
      }
      await page.screenshot({
        path: `test-results/layout-${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
});
