import process from "node:process";
import console from "node:console";
import openapiTS, { astToString } from "openapi-typescript";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const schemaText = execFileSync("../../.venv/bin/python", ["../../scripts/export_openapi.py"], { encoding: "utf8" });
const schema = JSON.parse(schemaText);
const types = astToString(await openapiTS(schema));
const lines = ['// Generated from FastAPI OpenAPI. Run npm run api:generate; do not edit.', 'import type { FetchOptions } from "openapi-fetch";', 'import type { paths } from "./schema";', 'import { transport } from "../transport";', ''];
for (const [path, methods] of Object.entries(schema.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (!operation.operationId) continue;
    lines.push(`export const ${operation.operationId} = (options: FetchOptions<paths[${JSON.stringify(path)}][${JSON.stringify(method)}]>) => transport.${method.toUpperCase()}(${JSON.stringify(path)}, options);`);
  }
}
const files = { "openapi.json": schemaText, "src/api/generated/schema.d.ts": types, "src/api/generated/sdk.ts": lines.join("\n") + "\n" };
let stale = false;
for (const [path, content] of Object.entries(files)) {
  if (process.argv.includes("--check")) {
    let current = "";
    try { current = readFileSync(path, "utf8"); } catch { /* Report missing generated artifacts. */ }
    if (current !== content) { console.error(`Stale generated API: ${path}`); stale = true; }
  } else writeFileSync(path, content);
}
if (stale) process.exit(1);
