import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";

// Deliberately document-local: duplicated tabs must never inherit another writer's identity.
const writerId = crypto.randomUUID();
const liveDrafts = new Map<string, unknown>();
type Recovery<T> = {
  key: string;
  revision: number;
  value: T;
  baseline: string;
  updatedAt: string;
};
type Draft<T> = Omit<Recovery<T>, "key" | "updatedAt">;
const different = <T>(draft: Draft<T>) =>
  JSON.stringify(draft.value) !== draft.baseline;

function read<T>(
  key: string,
  valid: (value: unknown) => value is T,
): Recovery<T> | null {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (
      data &&
      Number.isInteger(data.revision) &&
      data.revision >= 0 &&
      valid(data.value) &&
      typeof data.baseline === "string" &&
      typeof data.updatedAt === "string"
    )
      return { ...data, key };
  } catch {
    /* Invalid recovery data never replaces a saved document. */
  }
  return null;
}

/** Synchronous per-writer backups, snapshot-aware saves, and conservative server refreshes. */
export function useRecoverableDraft<T>(
  kind: string,
  versionId: string,
  serverValue: T,
  serverRevision: number,
  valid: (value: unknown) => value is T,
) {
  const prefix = `ael-recovery-v2:${kind}:${versionId}:`;
  const ownKey = prefix + writerId;
  const [state, setState] = useState<Draft<T>>(() => {
    const live = liveDrafts.get(ownKey) as Draft<T> | undefined;
    if (live) return live;
    const own = read(ownKey, valid);
    return own
      ? { value: own.value, revision: own.revision, baseline: own.baseline }
      : {
          value: serverValue,
          revision: serverRevision,
          baseline: JSON.stringify(serverValue),
        };
  });
  const current = useRef(state);
  const latest = useCallback(
    () => (liveDrafts.get(ownKey) as Draft<T> | undefined) || current.current,
    [ownKey],
  );
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recoveries, setRecoveries] = useState<Recovery<T>[]>([]);
  const write = useCallback(
    (next: Draft<T>) => {
      liveDrafts.set(ownKey, next);
      current.current = next;
      setState(next);
      window.dispatchEvent(
        new CustomEvent("ael-recovery-updated", { detail: ownKey }),
      );
      try {
        if (different(next))
          localStorage.setItem(
            ownKey,
            JSON.stringify({ ...next, updatedAt: new Date().toISOString() }),
          );
        else localStorage.removeItem(ownKey); // Only this document's writer can clear this key.
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
    },
    [ownKey],
  );
  useEffect(() => {
    function sync(event: Event) {
      if ((event as CustomEvent<string>).detail === ownKey) {
        const next = latest();
        current.current = next;
        setState(next);
      }
    }
    window.addEventListener("ael-recovery-updated", sync);
    return () => window.removeEventListener("ael-recovery-updated", sync);
  }, [ownKey, latest]);
  useEffect(() => {
    function scan() {
      const found: Recovery<T>[] = [];
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key?.startsWith(prefix) || key === ownKey) continue;
          const recovery = read(key, valid);
          if (
            recovery &&
            JSON.stringify(recovery.value) !== JSON.stringify(serverValue)
          )
            found.push(recovery);
        }
      } catch {
        setStorageAvailable(false);
      }
      setRecoveries(
        found.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    }
    scan();
    window.addEventListener("storage", scan);
    return () => window.removeEventListener("storage", scan);
  }, [prefix, ownKey, valid, serverValue]);
  useEffect(() => {
    // A dirty draft keeps its base revision, so the database can detect conflicts.
    if (serverRevision > latest().revision && !different(latest()))
      write({
        value: serverValue,
        revision: serverRevision,
        baseline: JSON.stringify(serverValue),
      });
  }, [serverRevision, serverValue, write, latest]);
  const setValue = useCallback(
    (update: SetStateAction<T>) => {
      const value =
        typeof update === "function"
          ? (update as (value: T) => T)(latest().value)
          : update;
      write({ ...latest(), value });
    },
    [write, latest],
  );
  function saved(value: T, revision: number) {
    // Edits made while the request was in flight remain dirty and backed up.
    if (revision < latest().revision) return false;
    write({ value: latest().value, revision, baseline: JSON.stringify(value) });
    return !different(latest());
  }
  function load(value: T, revision: number, expected?: T) {
    if (revision < latest().revision) return false;
    if (
      expected !== undefined &&
      JSON.stringify(latest().value) !== JSON.stringify(expected)
    )
      return false;
    write({ value, revision, baseline: JSON.stringify(value) });
    return true;
  }
  function restore(recovery: Recovery<T>) {
    write({
      value: recovery.value,
      revision: recovery.revision,
      baseline: recovery.baseline,
    });
  }
  return {
    value: state.value,
    revision: state.revision,
    dirty: different(state),
    setValue,
    saved,
    load,
    restore,
    recoveries,
    storageAvailable,
    newerSavedRevision: serverRevision > state.revision,
  };
}
