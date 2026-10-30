import { expect, test, type Page } from "@playwright/test";
const design = "/design/enterprise-rag-platform";
const unique = (label: string) => `${label} ${Date.now()}`;
const flow = (page: Page) => page.getByRole("textbox", { name: "Request and data flow", exact: true });
async function openFlow(page: Page) {
  await page.goto(design); await page.getByRole("tab", { name: "Data flow", exact: true }).click();
}
async function save(page: Page) {
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved in PostgreSQL", { exact: true })).toBeVisible();
}
test("design save then navigate and reopen uses the updated detail cache", async ({page}) => {
  await openFlow(page); const text=unique("Persisted flow"); await flow(page).fill(text); await save(page);
  await page.getByRole("link", {name:"All design challenges",exact:true}).click();
  await page.getByRole("link", {name:/Continue design|Start design/}).first().click();
  await page.getByRole("tab", {name:"Data flow",exact:true}).click(); await expect(flow(page)).toHaveValue(text);
  await page.reload(); await page.getByRole("tab", {name:"Data flow",exact:true}).click(); await expect(flow(page)).toHaveValue(text);
});
test("review drafts survive tab changes and navigation, and failed saves retain edits", async ({page}) => {
  await page.goto("/arena/top-k-vector-search"); await page.getByRole("tab",{name:"Review",exact:true}).click();
  const field=page.getByRole("textbox",{name:"Reasoning, evidence, and remaining questions"}); const text=unique("Unsaved evidence");
  await field.fill(text); const checkbox=page.getByRole("checkbox").first(); const checked=!(await checkbox.isChecked()); await checkbox.setChecked(checked);
  await page.getByRole("tab",{name:"Problem",exact:true}).click(); await page.getByRole("tab",{name:"Review",exact:true}).click();
  await expect(field).toHaveValue(text); expect(await checkbox.isChecked()).toBe(checked);
  await page.getByRole("link",{name:"All challenges",exact:true}).click(); await page.getByRole("link",{name:/Top-K vector search/}).first().click();
  await page.getByRole("tab",{name:"Review",exact:true}).click(); await expect(field).toHaveValue(text);
  await page.route("**/api/v1/challenges/top-k-vector-search/review",async route=>{ if(route.request().method()==="POST") await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:{code:"database_unavailable",message:"Simulated save failure"}})}); else await route.continue(); });
  await page.getByRole("button",{name:"Save review",exact:true}).click(); await expect(page.getByText("Simulated save failure",{exact:true})).toBeVisible();
  await expect(field).toHaveValue(text); await expect(page.getByText(/Unsaved review changes/)).toBeVisible();
  await page.unroute("**/api/v1/challenges/top-k-vector-search/review"); await page.getByRole("button",{name:"Save review",exact:true}).click();
  await expect(page.getByText("Review saved in PostgreSQL",{exact:true})).toBeVisible();
});
test("one tab's save preserves another tab's unsaved recovery, and stale saves conflict", async ({page,context}) => {
  const other=await context.newPage(); for(const tab of [page,other]) {tab.on("dialog",d=>d.accept()); await openFlow(tab);}
  const local=unique("Tab A unsaved"); const winner=unique("Tab B saved"); await flow(page).fill(local); await flow(other).fill(winner); await save(other);
  expect(await page.evaluate(text=>Object.keys(localStorage).some(key=>key.startsWith("ael-recovery-v2:design:")&&localStorage.getItem(key)?.includes(text)),local)).toBe(true);
  await page.getByRole("button",{name:"Save draft",exact:true}).click(); await expect(page.getByRole("alert")).toContainText("newer draft"); await expect(flow(page)).toHaveValue(local);
  await page.reload(); await page.getByText(/browser recovery copy available/).click(); await page.getByRole("button",{name:"Restore copy",exact:true}).first().click();
  await page.getByRole("tab",{name:"Data flow",exact:true}).click(); await expect(flow(page)).toHaveValue(local);
  const saved=await (await page.request.get("/api/v1/designs/enterprise-rag-platform")).json(); expect(saved.workspace.document.flow).toBe(winner); await other.close();
});
test("edits during a design save remain dirty and backed up after acknowledgement", async ({page}) => {
  await openFlow(page); const snapshot=unique("Requested"); const later=unique("Typed during save"); await flow(page).fill(snapshot);
  let release!:()=>void; const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/api/v1/designs/enterprise-rag-platform/workspace",async route=>{await gate;await route.continue();});
  await page.getByRole("button",{name:"Save draft",exact:true}).click(); await flow(page).fill(later); release();
  await expect(page.getByText("Earlier snapshot saved. Your newer edits still need saving.",{exact:true})).toBeVisible(); await expect(flow(page)).toHaveValue(later); await expect(page.getByText(/Unsaved changes/).first()).toBeVisible();
  const saved=await (await page.request.get("/api/v1/designs/enterprise-rag-platform")).json(); expect(saved.workspace.document.flow).toBe(snapshot);
  expect(await page.evaluate(text=>Object.keys(localStorage).some(key=>key.startsWith("ael-recovery-v2:design:")&&localStorage.getItem(key)?.includes(text)),later)).toBe(true);
});
test("previous versions are discoverable, exportable, and carried forward with provenance", async ({page}) => {
  await page.goto(design); await page.getByRole("button",{name:/Previous drafts/}).click(); const modal=page.getByRole("dialog"); await expect(modal).toBeVisible();
  await modal.getByText(/Content .*revision 2/).click(); await expect(modal.getByText("Previous-version request flow",{exact:true})).toBeVisible();
  const downloaded=page.waitForEvent("download"); await modal.getByRole("button",{name:"Export JSON",exact:true}).click(); expect((await downloaded).suggestedFilename()).toContain("previous.json");
  await modal.getByRole("button",{name:"Carry work into current draft",exact:true}).click(); await expect(modal).not.toBeVisible();
  await page.getByRole("tab",{name:"Data flow",exact:true}).click(); await expect(flow(page)).toHaveValue("Previous-version request flow"); await save(page);
  const saved=await (await page.request.get("/api/v1/designs/enterprise-rag-platform")).json(); expect(saved.workspace.source_revision).toBe(2);
  const history=await (await page.request.get("/api/v1/designs/enterprise-rag-platform/previous-drafts")).json(); expect(history.items[0].document.flow).toBe("Previous-version request flow");
});
