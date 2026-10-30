import init, { Workspace, PositionEncoding } from "@astral-sh/ruff-wasm-web";
import wasmUrl from "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm?url";
import type {
  PythonToolRequest,
  PythonToolResponse,
} from "./editorPreferences";

let initialized: ReturnType<typeof init> | undefined;
self.onmessage = async (event: MessageEvent<PythonToolRequest>) => {
  const { id, code } = event.data;
  let workspace: Workspace | undefined;
  try {
    if (new TextEncoder().encode(code).length > 32768)
      throw new Error("Python tools support up to 32 KiB of code.");
    initialized ??= init({ module_or_path: wasmUrl }).catch((error) => {
      initialized = undefined;
      throw error;
    });
    await initialized;
    workspace = new Workspace(
      {
        "line-length": 88,
        "indent-width": 4,
        "target-version": "py312",
        format: { "indent-style": "space", "quote-style": "double" },
      },
      PositionEncoding.Utf16,
    );
    self.postMessage({
      id,
      formatted: workspace.format(code),
    } satisfies PythonToolResponse);
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    } satisfies PythonToolResponse);
  } finally {
    workspace?.free();
  }
};
