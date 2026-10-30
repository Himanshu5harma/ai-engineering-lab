import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRecoverableDraft } from "./useRecoverableDraft";
type Value = { notes: string };
function valid(value: unknown): value is Value {
  return (
    !!value &&
    typeof value === "object" &&
    "notes" in value &&
    typeof value.notes === "string"
  );
}
const initial = { notes: "Saved" };
describe("recoverable drafts", () => {
  it("refreshes clean drafts and keeps dirty edits on their original revision", () => {
    const { result, rerender } = renderHook(
      ({ value, revision }) =>
        useRecoverableDraft("test", "refresh", value, revision, valid),
      { initialProps: { value: initial, revision: 1 } },
    );
    rerender({ value: { notes: "Remote" }, revision: 2 });
    expect(result.current.value.notes).toBe("Remote");
    act(() => result.current.setValue({ notes: "Unsaved" }));
    rerender({ value: { notes: "New remote" }, revision: 3 });
    expect(result.current.value.notes).toBe("Unsaved");
    expect(result.current.revision).toBe(2);
    expect(result.current.newerSavedRevision).toBe(true);
  });
  it("a save clears only its own snapshot and never another tab's recovery", () => {
    const otherKey = "ael-recovery-v2:test:copies:another-tab";
    const other = JSON.stringify({
      revision: 1,
      value: { notes: "Other unsaved" },
      baseline: JSON.stringify(initial),
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(otherKey, other);
    const { result } = renderHook(() =>
      useRecoverableDraft("test", "copies", initial, 1, valid),
    );
    act(() => result.current.setValue({ notes: "Snapshot" }));
    const snapshot = result.current.value;
    act(() => result.current.setValue({ notes: "Typed during save" }));
    act(() => result.current.saved(snapshot, 2));
    expect(result.current.value.notes).toBe("Typed during save");
    expect(result.current.dirty).toBe(true);
    expect(result.current.revision).toBe(2);
    expect(localStorage.getItem(otherKey)).toBe(other);
  });
  it("an in-flight save completing after navigation preserves the remounted draft", () => {
    const first = renderHook(() =>
      useRecoverableDraft("test", "navigate", initial, 1, valid),
    );
    act(() => first.result.current.setValue({ notes: "Requested save" }));
    const pendingSave = first.result.current.saved;
    const snapshot = first.result.current.value;
    first.unmount();
    const reopened = renderHook(() =>
      useRecoverableDraft("test", "navigate", initial, 1, valid),
    );
    expect(reopened.result.current.value.notes).toBe("Requested save");
    act(() =>
      reopened.result.current.setValue({
        notes: "New edits after navigating back",
      }),
    );
    act(() => pendingSave(snapshot, 2));
    expect(reopened.result.current.value.notes).toBe(
      "New edits after navigating back",
    );
    expect(reopened.result.current.dirty).toBe(true);
    expect(reopened.result.current.revision).toBe(2);
  });
});

it("refuses a destructive load if typing changed the draft during the fetch", () => {
  const { result } = renderHook(() =>
    useRecoverableDraft("test", "load-race", initial, 1, valid),
  );
  act(() => result.current.setValue({ notes: "Before fetch" }));
  const snapshot = result.current.value;
  act(() => result.current.setValue({ notes: "Typed during fetch" }));
  let loaded = true;
  act(() => {
    loaded = result.current.load({ notes: "Remote" }, 2, snapshot);
  });
  expect(loaded).toBe(false);
  expect(result.current.value.notes).toBe("Typed during fetch");
  expect(result.current.revision).toBe(1);
});
