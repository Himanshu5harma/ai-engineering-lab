export type EditorPreferences = {
  fontSize: number;
};
export const EDITOR_PREFERENCES_KEY = "ael-editor-preferences-v1";
export const defaultPreferences: EditorPreferences = {
  fontSize: 15,
};
export function readPreferences(): EditorPreferences {
  try {
    const value = JSON.parse(
      localStorage.getItem(EDITOR_PREFERENCES_KEY) || "{}",
    );
    if (!value || typeof value !== "object") return { ...defaultPreferences };
    return {
      fontSize: Number.isInteger(value.fontSize)
        ? Math.max(12, Math.min(24, value.fontSize))
        : 15,
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export type PythonToolRequest = {
  id: number;
  code: string;
};
export type PythonToolResponse = {
  id: number;
  formatted?: string;
  error?: string;
};
