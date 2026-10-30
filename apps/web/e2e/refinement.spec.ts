import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const artifactDir = resolve("../../output/playwright/refinement");
for (const [name, width, height] of [["laptop",1366,768],["desktop",1477,871],["tablet",820,1180],["mobile",390,844]] as const) {
  for (const theme of ["light","dark"]) {
    test(`refinement ${name} ${theme}: workspace and page usability`, async ({page}) => {
      await mkdir(artifactDir,{recursive:true});
      await page.setViewportSize({width,height});
      await page.addInitScript((theme) => localStorage.setItem("ael-theme-minimal",theme),theme);
      for (const [label,path] of [["overview","/"],["catalog","/arena"],["activity","/activity"],["progress","/progress"],["curriculum","/curriculum"],["design-catalog","/design"],["coding","/arena/top-k-vector-search"],["studio","/design/enterprise-rag-platform"]]) {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (label === "activity" && width < 850) {
          const inspect=page.getByRole("button",{name:/^Inspect /}).first();
          if(await inspect.count()) {
            await inspect.focus(); await expect(inspect).toBeInViewport(); await inspect.click();
            await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape");
            await expect(page.getByRole("dialog")).not.toBeVisible();
            await page.locator(".history-table-wrap").evaluate(element=>{element.scrollLeft=0;});
          }
        }
        if (label === "coding") {
          await expect(page.locator(".monaco-editor").first()).toBeVisible();
          const codeBounds=await page.locator(".code-panel").boundingBox();
          if(width<850) expect(codeBounds!.width).toBeGreaterThan(width-64);
          await expect(page.getByRole("button",{name:"Format code",exact:true})).toBeInViewport();
          await expect(page.getByRole("combobox",{name:"Code font size",exact:true})).toBeInViewport();
          await expect(page.getByRole("button",{name:"Reset to starter code",exact:true})).toBeInViewport();
          await expect(page.getByRole("button",{name:"Run tests",exact:true})).toBeInViewport();
          await expect(page.getByRole("button",{name:"Submit",exact:true})).toBeInViewport();
          await expect(page.locator(".results-scroll")).toBeInViewport();
          if (name === "laptop") {
            const lines = await page.locator(".monaco-surface").evaluate((element) => Math.floor((element.getBoundingClientRect().height - 34) / 26));
            expect(lines).toBeGreaterThanOrEqual(12);
          }
          if (width >= 850) {
            await page.getByRole("tab", {name:"Notes",exact:true}).focus();
            await page.keyboard.press("ArrowRight");
            await expect(page.getByRole("tab",{name:"Review",exact:true})).toBeFocused();
            await page.getByRole("tab",{name:"Problem",exact:true}).click();
          }
        }
        if (label === "studio") {
          await expect(page.getByTestId("architecture-canvas")).toBeVisible();
          const canvas = await page.getByTestId("architecture-canvas").boundingBox();
          expect(canvas?.height).toBeGreaterThanOrEqual(name === "mobile" ? 300 : 250);
          expect(canvas!.y + Math.min(canvas!.height,250)).toBeLessThan(height);
          await expect(page.getByRole("button",{name:"Save draft",exact:true})).toBeInViewport();
          await expect(page.getByRole("button",{name:"Export JSON",exact:true})).toBeInViewport();
          await page.getByRole("tab",{name:"Diagram",exact:true}).focus();
          await page.keyboard.press("ArrowRight");
          await expect(page.getByRole("tab",{name:"Data flow",exact:true})).toBeFocused();
          await expect(page.getByRole("textbox",{name:"Request and data flow",exact:true})).toBeVisible();
          await page.getByRole("tab",{name:"Diagram",exact:true}).click();
        }
        await page.screenshot({path:resolve(artifactDir,`${label}-${name}-${theme}.png`),fullPage:!['coding','studio'].includes(label)});
      }
    });
  }
}
