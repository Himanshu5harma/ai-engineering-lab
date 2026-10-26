import { useMemo, useState, useSyncExternalStore } from "react";

const KEY = "ael-bookmarked-challenges";
const EVENT = "ael-bookmarks-changed";
function snapshot() {
  try {
    return localStorage.getItem(KEY) || "[]";
  } catch {
    return "[]";
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}

export function useBookmarks() {
  const raw = useSyncExternalStore(subscribe, snapshot);
  const [error, setError] = useState<string>();
  const saved = useMemo<string[]>(() => {
    try {
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }, [raw]);
  function toggle(slug: string) {
    try {
      const next = saved.includes(slug)
        ? saved.filter((value) => value !== slug)
        : [...saved, slug];
      localStorage.setItem(KEY, JSON.stringify(next));
      setError(undefined);
      window.dispatchEvent(new Event(EVENT));
    } catch {
      setError(
        "Browser storage is unavailable. This challenge could not be saved.",
      );
    }
  }
  return { saved, toggle, error };
}
