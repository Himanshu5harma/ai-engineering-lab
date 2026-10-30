import { Select } from "../../components/ui/primitives";
import { IconButton } from "../../components/ui/button";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController";
import "monaco-editor/esm/vs/editor/contrib/format/browser/formatActions";
import "monaco-editor/esm/vs/editor/contrib/folding/browser/folding";
import "monaco-editor/esm/vs/editor/contrib/comment/browser/comment";
import "monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations";
import { useEffect, useRef, useState } from "react";
import { Check, FileCode2, RotateCcw, WandSparkles, X } from "lucide-react";
import { EDITOR_PREFERENCES_KEY, readPreferences } from "./editorPreferences";
import { PythonTools } from "./pythonTools";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });
monaco.editor.defineTheme("ael-midnight", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "71839E", fontStyle: "italic" },
    { token: "keyword", foreground: "BDACFF" },
    { token: "string", foreground: "93D9BC" },
    { token: "number", foreground: "F2C78C" },
    { token: "identifier", foreground: "DCE6F4" },
    { token: "type.identifier", foreground: "8BCDE5" },
    { token: "delimiter", foreground: "9DACBF" },
  ],
  colors: {
    "editor.background": "#111B2B",
    "editor.foreground": "#DCE6F4",
    "editorLineNumber.foreground": "#52647F",
    "editorLineNumber.activeForeground": "#A9C7F7",
    "editor.lineHighlightBackground": "#19263A",
    "editor.selectionBackground": "#2B4368",
    "editorCursor.foreground": "#7DCDE8",
    "editorIndentGuide.background1": "#22314A",
    "editorWidget.background": "#19263A",
    "editorWidget.border": "#344764",
  },
});
monaco.editor.defineTheme("ael-paper", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "8190A6", fontStyle: "italic" },
    { token: "keyword", foreground: "7854B7" },
    { token: "string", foreground: "24745D" },
    { token: "number", foreground: "AC682B" },
  ],
  colors: {
    "editor.background": "#FCFDFF",
    "editor.foreground": "#24354F",
    "editor.lineHighlightBackground": "#F1F5FC",
    "editorLineNumber.foreground": "#A1AEC1",
    "editor.selectionBackground": "#D9E6FF",
    "editorCursor.foreground": "#426CDD",
  },
});

export function PythonEditor({
  code,
  onChange,
  theme,
  modelKey = "solution",
  draftSaved = true,
  onReset,
}: {
  code: string;
  onChange: (code: string) => void;
  theme: string;
  modelKey?: string;
  draftSaved?: boolean;
  onReset?: () => void;
}) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [editorReady, setEditorReady] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [notice, setNotice] = useState("");
  const tools = useRef<PythonTools | null>(null);
  const activeEditor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposables = useRef<monaco.IDisposable[]>([]);
  const modelPath = `inmemory://ael/${encodeURIComponent(modelKey)}/solution.py`;

  useEffect(() => {
    tools.current = new PythonTools();
    return () => {
      tools.current?.dispose();
      tools.current = null;
      activeEditor.current = null;
      disposables.current.forEach((item) => item.dispose());
      monaco.editor.getModel(monaco.Uri.parse(modelPath))?.dispose();
    };
  }, [modelPath]);
  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      /* Font size still applies during this visit. */
    }
  }, [preferences]);
  useEffect(() => {
    if (notice !== "Code formatted") return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function formatModel(
    model: monaco.editor.ITextModel,
    token?: monaco.CancellationToken,
  ): Promise<monaco.languages.TextEdit[]> {
    const version = model.getVersionId();
    setFormatting(true);
    setNotice("");
    try {
      const result = await tools.current!.request(model.getValue());
      if (
        token?.isCancellationRequested ||
        model.isDisposed() ||
        model.getVersionId() !== version
      ) {
        setNotice("Kept your latest edits. Format again.");
        return [];
      }
      if (result.formatted === undefined)
        throw new Error("Formatter returned no code");
      setNotice("Code formatted");
      return [{ range: model.getFullModelRange(), text: result.formatted }];
    } catch (error) {
      setNotice(
        `Could not format: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      setFormatting(false);
    }
  }
  async function formatCurrent() {
    const model = activeEditor.current?.getModel();
    if (!model) return;
    const edits = await formatModel(model);
    const target = activeEditor.current;
    if (edits.length && target?.getModel() === model) {
      target.pushUndoStop();
      target.executeEdits("ael-ruff", edits);
      target.pushUndoStop();
      target.focus();
    }
  }
  function bind(instance: monaco.editor.IStandaloneCodeEditor) {
    activeEditor.current = instance;
    disposables.current.forEach((item) => item.dispose());
    disposables.current = [
      monaco.languages.registerDocumentFormattingEditProvider("python", {
        provideDocumentFormattingEdits(model, _, token) {
          return model === instance.getModel() ? formatModel(model, token) : [];
        },
      }),
      instance.addAction({
        id: "ael.formatPython",
        label: "Format Python",
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        ],
        run: () => formatCurrent(),
      }),
    ];
    setEditorReady(true);
  }
  const editorTheme = theme === "dark" ? "ael-midnight" : "ael-paper";
  return (
    <div className="python-editor-shell" data-editor-theme={editorTheme}>
      <div
        className="editor-toolbar editor-toolbar-simple"
        role="toolbar"
        aria-label="Python editor tools"
      >
        <span className="editor-file">
          <FileCode2 size={14} />
          solution.py
        </span>
        <div className="editor-essential-controls">
          <span
            className={`draft-state ${draftSaved ? "" : "draft-error"}`}
            title={
              draftSaved
                ? "Draft saved in this browser"
                : "Browser storage unavailable; your draft has not been saved"
            }
          >
            {draftSaved && <Check size={11} />}
            {draftSaved ? "Saved" : "Unsaved"}
          </span>
          <Select
            className="editor-font-size"
            aria-label="Code font size"
            value={preferences.fontSize}
            onChange={(event) =>
              setPreferences({ fontSize: Number(event.target.value) })
            }
          >
            {Array.from({ length: 13 }, (_, index) => index + 12).map(
              (size) => (
                <option key={size} value={size}>
                  {size} px
                </option>
              ),
            )}
          </Select>
          <button
            className="editor-tool format-tool"
            aria-label="Format code"
            disabled={!editorReady || formatting}
            title="Format Python · Shift+Alt+F"
            onClick={() => {
              void formatCurrent();
            }}
          >
            <WandSparkles size={14} />
            {formatting ? "Formatting…" : "Format"}
          </button>
          {onReset && (
            <IconButton
              className="editor-reset"
              aria-label="Reset to starter code"
              title="Reset to starter code"
              onClick={onReset}
            >
              <RotateCcw size={14} />
            </IconButton>
          )}
        </div>
      </div>
      <div className="monaco-surface">
        <Editor
          language="python"
          path={modelPath}
          keepCurrentModel
          value={code}
          onChange={(value) => onChange(value || "")}
          theme={editorTheme}
          onMount={bind}
          loading={<div className="loading">Loading Python editor…</div>}
          options={{
            fontSize: preferences.fontSize,
            lineHeight: Math.round(preferences.fontSize * 1.7),
            fontFamily:
              "'SFMono-Regular', 'Cascadia Code', Consolas, monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            renderWhitespace: "selection",
            padding: { top: 18, bottom: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            ariaLabel: "Python solution editor",
            renderLineHighlight: "all",
            quickSuggestions: false,
            wordBasedSuggestions: "off",
            parameterHints: { enabled: false },
            folding: true,
            bracketPairColorization: { enabled: true },
            guides: { indentation: true },
            stickyScroll: { enabled: false },
            contextmenu: true,
            overviewRulerBorder: false,
            fixedOverflowWidgets: true,
          }}
        />
      </div>
      {notice && (
        <div className="editor-notice" role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss editor notice"
            onClick={() => setNotice("")}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
