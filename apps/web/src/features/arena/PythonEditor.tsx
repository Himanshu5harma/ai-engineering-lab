import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

export function PythonEditor({
  code,
  onChange,
  theme,
}: {
  code: string;
  onChange: (code: string) => void;
  theme: string;
}) {
  return (
    <Editor
      language="python"
      value={code}
      onChange={(value) => onChange(value || "")}
      theme={theme === "dark" ? "vs-dark" : "light"}
      loading={<div className="loading">Loading local Python editor…</div>}
      options={{
        fontSize: 14,
        lineHeight: 24,
        fontFamily: "'SFMono-Regular', Consolas, monospace",
        minimap: { enabled: false },
        padding: { top: 20 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "on",
        ariaLabel: "Python solution editor",
        renderLineHighlight: "gutter",
        quickSuggestions: false,
      }}
    />
  );
}
