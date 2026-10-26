import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  NotebookPen,
  Check,
  ChevronRight,
  FileCode2,
  History,
  Lightbulb,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import {
  active,
  api,
  statusLabel,
  type Action,
  type Challenge,
} from "../../api/client";
import { ErrorBox, Loading } from "../../components/Feedback";
import { Results } from "./Results";
import { useBookmarks } from "../../hooks/useBookmarks";
const PythonEditor = lazy(() =>
  import("./PythonEditor").then((module) => ({ default: module.PythonEditor })),
);

export function Arena({ theme }: { theme: string }) {
  const { slug = "" } = useParams();
  const challenge = useQuery({
    queryKey: ["challenge", slug],
    queryFn: () => api.challenge(slug),
  });
  if (challenge.isPending) return <Loading />;
  if (challenge.error)
    return (
      <ErrorBox
        error={challenge.error}
        retry={() => {
          void challenge.refetch();
        }}
      />
    );
  return (
    <Workspace
      key={challenge.data.version_id}
      challenge={challenge.data}
      theme={theme}
    />
  );
}

function readDraft(key: string, starter: string) {
  try {
    return localStorage.getItem(key) ?? starter;
  } catch {
    return starter;
  }
}
function Workspace({
  challenge,
  theme,
}: {
  challenge: Challenge;
  theme: string;
}) {
  const key = `ael-draft:${challenge.version_id}`;
  const [code, setCode] = useState(() =>
    readDraft(key, challenge.starter_code),
  );
  const [draftSaved, setDraftSaved] = useState(true);
  const notesKey = `ael-notes:${challenge.version_id}`;
  const [notes, setNotes] = useState(() => readDraft(notesKey, ""));
  const [notesSaved, setNotesSaved] = useState(true);
  const { saved, toggle, error: bookmarkError } = useBookmarks();
  const [tab, setTab] = useState("problem");
  const [bottomTab, setBottomTab] = useState("results");
  const [hints, setHints] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [historyOffset, setHistoryOffset] = useState(0);
  const [restoreError, setRestoreError] = useState<Error>();
  const queryClient = useQueryClient();
  const availability = useQuery({
    queryKey: ["availability"],
    queryFn: api.availability,
    refetchInterval: 5000,
  });
  const history = useQuery({
    queryKey: ["history", challenge.slug, historyOffset],
    queryFn: () => api.history(challenge.slug, historyOffset),
    refetchInterval: 2500,
  });
  const selected = useQuery({
    queryKey: ["submission", selectedId],
    queryFn: () => api.submission(selectedId!),
    enabled: !!selectedId,
    refetchInterval: (query) =>
      active(query.state.data?.status) ? 600 : false,
  });
  const execute = useMutation({
    mutationFn: (action: Action) => api.execute(challenge, code, action),
    onSuccess: (result) => {
      queryClient.setQueryData(["submission", result.id], result);
      setSelectedId(result.id);
      setBottomTab("results");
      void queryClient.invalidateQueries({
        queryKey: ["history", challenge.slug],
      });
    },
  });
  const pendingHistory =
    history.data?.items.some((s) => active(s.status)) ?? false;
  const busy =
    execute.isPending || active(selected.data?.status) || pendingHistory;
  const canExecute = availability.data?.available && !busy;
  const perform = useCallback(
    (action: Action) => {
      if (canExecute) execute.mutate(action);
    },
    [canExecute, execute],
  );
  useEffect(() => {
    try {
      localStorage.setItem(key, code);
      setDraftSaved(true);
    } catch {
      setDraftSaved(false);
    }
  }, [key, code]);
  useEffect(() => {
    try {
      localStorage.setItem(notesKey, notes);
      setNotesSaved(true);
    } catch {
      setNotesSaved(false);
    }
  }, [notesKey, notes]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (code !== challenge.starter_code) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [code, challenge.starter_code]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        perform(event.shiftKey ? "submit" : "run");
      }
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [perform]);
  useEffect(() => {
    if (selected.data && !active(selected.data.status)) {
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
      void queryClient.invalidateQueries({
        queryKey: ["history", challenge.slug],
      });
    }
  }, [selected.data?.status, selected.data, queryClient, challenge.slug]);
  useEffect(() => {
    if (!selectedId) {
      const latest = history.data?.items[0];
      if (latest) setSelectedId(latest.id);
    }
  }, [history.data, selectedId]);
  const restore = async (id: string) => {
    try {
      const row = await api.submission(id);
      if (
        row.code &&
        (code === challenge.starter_code ||
          window.confirm("Replace your current draft with this saved code?"))
      )
        setCode(row.code);
      setSelectedId(id);
      setBottomTab("results");
      setRestoreError(undefined);
    } catch (error) {
      setRestoreError(
        error instanceof Error
          ? error
          : new Error("Could not restore saved code"),
      );
    }
  };
  return (
    <div className="arena-page">
      <div className="arena-heading">
        <Link to="/arena">
          <ArrowLeft size={15} />
          All challenges
        </Link>
        <div className="arena-heading-title">
          <h1>{challenge.title}</h1>
          <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
          <button
            className={`button small workspace-save ${saved.includes(challenge.slug) ? "is-saved" : ""}`}
            aria-label={`${saved.includes(challenge.slug) ? "Unsave" : "Save"} this challenge`}
            aria-pressed={saved.includes(challenge.slug)}
            onClick={() => toggle(challenge.slug)}
          >
            <Bookmark
              size={14}
              fill={saved.includes(challenge.slug) ? "currentColor" : "none"}
            />
            {saved.includes(challenge.slug) ? "Saved" : "Save challenge"}
          </button>
        </div>
        <span className="subtle">PYTHON 3.12 · STANDARD LIBRARY</span>
      </div>
      {(!availability.data?.available || availability.error) && (
        <div className="unavailable-banner" role="status">
          <ShieldCheck size={17} />
          <span>
            {availability.error?.message ||
              availability.data?.message ||
              "Checking local execution worker…"}{" "}
            You can still edit and save a draft.
          </span>
        </div>
      )}
      {bookmarkError && (
        <div className="inline-warning" role="alert">
          {bookmarkError}
        </div>
      )}
      <div className="workspace">
        <section className="problem-panel">
          <div
            className="tab-bar"
            role="tablist"
            aria-label="Challenge content"
          >
            <button
              role="tab"
              aria-selected={tab === "problem"}
              className={tab === "problem" ? "selected" : ""}
              onClick={() => setTab("problem")}
            >
              <FileCode2 size={15} />
              Problem
            </button>
            <button
              role="tab"
              aria-selected={tab === "hints"}
              className={tab === "hints" ? "selected" : ""}
              onClick={() => setTab("hints")}
            >
              <Lightbulb size={15} />
              Hints
            </button>
            <button
              role="tab"
              aria-selected={tab === "notes"}
              className={tab === "notes" ? "selected" : ""}
              onClick={() => setTab("notes")}
            >
              <NotebookPen size={15} />
              Notes
            </button>
          </div>
          <div className="problem-scroll" role="tabpanel">
            {tab === "problem" ? (
              <>
                <div className="tag-row">
                  {challenge.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="markdown">
                  <Markdown>{challenge.problem}</Markdown>
                  <h2>Constraints</h2>
                  <ul>
                    {challenge.constraints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <h2>Learning objectives</h2>
                  <ul>
                    {challenge.learning_objectives.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="production-context">
                  <span>
                    <ShieldCheck size={16} />
                    IN PRODUCTION
                  </span>
                  <p>{challenge.production_relevance}</p>
                </div>
                <details className="public-inputs">
                  <summary>
                    Inspect public test inputs <ChevronRight size={14} />
                  </summary>
                  {challenge.public_cases.map((c) => (
                    <div key={c.name}>
                      <strong>{c.name}</strong>
                      <pre>{JSON.stringify(c.kwargs, null, 2)}</pre>
                      <small>
                        Expected:{" "}
                        {c.raises
                          ? `raises ${c.raises}`
                          : JSON.stringify(c.expected)}
                      </small>
                    </div>
                  ))}
                </details>
              </>
            ) : tab === "hints" ? (
              <div className="hints-content">
                <Lightbulb size={25} />
                <h2>A nudge, when you need one.</h2>
                <p>
                  Reveal one hint at a time. Try an implementation before
                  reading further.
                </p>
                {challenge.hints.slice(0, hints).map((h, i) => (
                  <div className="hint" key={h}>
                    <span>HINT {i + 1}</span>
                    <Markdown>{h}</Markdown>
                  </div>
                ))}
                <button
                  className="button"
                  disabled={hints === challenge.hints.length}
                  onClick={() => setHints((n) => n + 1)}
                >
                  {hints === challenge.hints.length
                    ? "All hints revealed"
                    : "Reveal next hint"}
                </button>
              </div>
            ) : (
              <div className="notes-content">
                <NotebookPen size={25} />
                <h2>Keep the reasoning.</h2>
                <p>
                  Capture the edge cases, trade-offs, or questions you want to
                  revisit.
                </p>
                <label htmlFor="engineering-notes">Engineering notes</label>
                <textarea
                  id="engineering-notes"
                  value={notes}
                  maxLength={20000}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="What did you learn? What would change in production?"
                />
                <div
                  className={`notes-save-state ${notesSaved ? "" : "save-failed"}`}
                  role="status"
                >
                  {notesSaved
                    ? "Saved in this browser"
                    : "Could not save — browser storage is unavailable"}
                </div>
                <small>
                  Notes stay with this challenge version on this browser.
                </small>
              </div>
            )}
          </div>
        </section>
        <section className="code-panel">
          <div className="editor-toolbar">
            <span>
              <FileCode2 size={15} />
              solution.py<span className="language-label">Python</span>
            </span>
            <div>
              <span
                className={`draft-state ${draftSaved ? "" : "draft-error"}`}
              >
                {draftSaved ? <Check size={12} /> : null}
                {draftSaved ? "Draft saved locally" : "Draft not saved"}
              </span>
              <button
                className="icon-button"
                aria-label="Reset to starter code"
                title="Reset to starter code"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset your draft to the starter implementation?",
                    )
                  )
                    setCode(challenge.starter_code);
                }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          <div className="editor-container">
            <Suspense
              fallback={<Loading text="Loading local Python editor…" />}
            >
              <PythonEditor code={code} onChange={setCode} theme={theme} />
            </Suspense>
          </div>
          <div className="execution-toolbar">
            <span className="shortcut">⌘ / Ctrl + Enter to run</span>
            <div>
              <button
                className="button"
                disabled={!canExecute}
                onClick={() => perform("run")}
              >
                <Play size={14} />
                {execute.isPending && execute.variables === "run"
                  ? "Queuing…"
                  : "Run tests"}
              </button>
              <button
                className="button primary"
                disabled={!canExecute}
                onClick={() => perform("submit")}
              >
                <Send size={14} />
                {execute.isPending && execute.variables === "submit"
                  ? "Queuing…"
                  : "Submit"}
              </button>
            </div>
          </div>
          {execute.error && <ErrorBox error={execute.error} />}
          <div className="results-panel">
            <div
              className="tab-bar"
              role="tablist"
              aria-label="Execution output"
            >
              <button
                role="tab"
                aria-selected={bottomTab === "results"}
                className={bottomTab === "results" ? "selected" : ""}
                onClick={() => setBottomTab("results")}
              >
                <Check size={15} />
                Test results
              </button>
              <button
                role="tab"
                aria-selected={bottomTab === "history"}
                className={bottomTab === "history" ? "selected" : ""}
                onClick={() => setBottomTab("history")}
              >
                <History size={15} />
                History
              </button>
            </div>
            <div className="results-scroll" role="tabpanel">
              {bottomTab === "results" ? (
                selected.error ? (
                  <ErrorBox
                    error={selected.error}
                    retry={() => {
                      void selected.refetch();
                    }}
                  />
                ) : (
                  <Results submission={selected.data} />
                )
              ) : (
                <>
                  {restoreError && <ErrorBox error={restoreError} />}
                  {history.isPending ? (
                    <Loading />
                  ) : history.error ? (
                    <ErrorBox
                      error={history.error}
                      retry={() => {
                        void history.refetch();
                      }}
                    />
                  ) : !history.data.items.length ? (
                    <div className="results-empty">
                      No executions yet. Your runs and submissions will be saved
                      here.
                    </div>
                  ) : (
                    <>
                      <div className="history-list">
                        {history.data.items.map((s) => (
                          <div key={s.id}>
                            <button
                              onClick={() => {
                                setSelectedId(s.id);
                                setBottomTab("results");
                              }}
                            >
                              <strong className={`status-text ${s.status}`}>
                                {statusLabel(s.status)}
                              </strong>
                              <span>
                                {s.action === "run" ? "Run" : "Submit"} ·{" "}
                                {new Date(s.created_at).toLocaleString()}
                              </span>
                            </button>
                            <button
                              className="text-link"
                              onClick={() => {
                                void restore(s.id);
                              }}
                            >
                              Restore code
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="history-pagination">
                        <button
                          className="button small"
                          disabled={historyOffset === 0}
                          onClick={() =>
                            setHistoryOffset((n) => Math.max(0, n - 20))
                          }
                        >
                          Newer
                        </button>
                        <button
                          className="button small"
                          disabled={!history.data.has_more}
                          onClick={() => setHistoryOffset((n) => n + 20)}
                        >
                          Older
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
      <div className="arena-statusbar">
        <span>
          <i className="accent-dot" />
          {availability.data?.available
            ? "Local worker connected"
            : "Worker unavailable"}
        </span>
        <span>
          Run: {challenge.public_count} public tests{" "}
          <span className="divider">/</span> Submit:{" "}
          {challenge.verification_count} verification tests
        </span>
        <span>Content v{challenge.version_id.split(":")[1].slice(0, 8)}</span>
      </div>
    </div>
  );
}
