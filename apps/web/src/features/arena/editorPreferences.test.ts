import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultPreferences,
  EDITOR_PREFERENCES_KEY,
  readPreferences,
} from "./editorPreferences";
beforeEach(() => localStorage.clear());
describe("saved editor preferences", () => {
  it("keeps sensible defaults when storage contains malformed data", () => {
    localStorage.setItem(EDITOR_PREFERENCES_KEY, "{broken");
    expect(readPreferences()).toEqual(defaultPreferences);
    localStorage.setItem(EDITOR_PREFERENCES_KEY, "null");
    expect(readPreferences()).toEqual(defaultPreferences);
  });
  it("validates old or edited settings without losing supported choices", () => {
    localStorage.setItem(
      EDITOR_PREFERENCES_KEY,
      JSON.stringify({
        fontSize: 500,
        tabSize: 3,
        theme: "unsupported",
        minimap: true,
        wordWrap: "false",
        lineNumbers: false,
      }),
    );
    expect(readPreferences()).toEqual({ fontSize: 24 });
  });
});
