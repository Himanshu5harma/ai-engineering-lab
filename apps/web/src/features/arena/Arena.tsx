import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/primitives";
import { Button } from "../../components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  ClipboardCheck,
  NotebookPen,
  Check,
  ChevronRight,
  FileCode2,
  History,
  Lightbulb,
  Play,
  Send,
  ShieldCheck,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Markdown from "react-markdown";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
import { EngineeringReview } from "./EngineeringReview";
import { SplitHandle } from "./SplitHandle";
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
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() =>
    ["problem", "hints", "notes", "review"].includes(params.get("tab") || "")
      ? params.get("tab")!
      : "problem",
  );
  const [bottomTab, setBottomTab] = useState("results");
  const [hints, setHints] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [historyOffset, setHistoryOffset] = useState(0);
  const [restoreError, setRestoreError] = useState<Error>();
  const root = useRef<HTMLDivElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [focus, setFocus] = useState(false);
  const [mobilePane, setMobilePane] = useState("code");
  const [resultsOpen, setResultsOpen] = useState(true);
  const [problemWidth, setProblemWidth] = useState(34);
  const [resultsSize, setResultsSize] = useState(120);
  const [workspaceWidth, setWorkspaceWidth] = useState(1000);
  const [maxResultsSize, setMaxResultsSize] = useState(360);
  const [layoutNotice, setLayoutNotice] = useState("");
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
      setResultsOpen(true);
      setResultsSize(216);
      setMobilePane("code");
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
    if (!workspace.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setWorkspaceWidth(entry.contentRect.width || 1000);
      setMaxResultsSize(
        Math.max(100, Math.min(360, entry.contentRect.height - 440)),
      );
    });
    observer.observe(workspace.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);
  useEffect(() => {
    const fullscreenChanged = () =>
      setExpanded(document.fullscreenElement === root.current);
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !root.current?.querySelector("dialog[open]")
      ) {
        if (document.fullscreenElement === root.current)
          void document.exitFullscreen().catch(() => {});
        setExpanded(false);
      }
    };
    document.addEventListener("fullscreenchange", fullscreenChanged);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreenChanged);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  async function toggleFullscreen() {
    if (expanded) {
      if (document.fullscreenElement === root.current)
        await document.exitFullscreen();
      setExpanded(false);
    } else {
      setExpanded(true);
      setLayoutNotice("");
      try {
        await root.current?.requestFullscreen?.();
      } catch {
        setLayoutNotice(
          "Workspace expanded. Browser fullscreen is unavailable; press Esc to return.",
        );
      }
    }
  }
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
      setResultsOpen(true);
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
    <div
      ref={root}
      className={`arena-page arena-workbench ${expanded ? "arena-expanded" : ""} ${focus ? "editor-focus" : ""}`}
    >
      <div className="arena-heading">
        <Link to="/arena">
          <ArrowLeft size={15} />
          All challenges
        </Link>
        <div className="arena-heading-title">
          {challenge.curriculum_id && (
            <span className="challenge-id">{challenge.curriculum_id}</span>
          )}
          <h1 title={challenge.title}>{challenge.title}</h1>
          <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
        </div>
        <div className="workspace-view-controls">
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
          <div
            className="mobile-workspace-switch"
            aria-label="Mobile workspace view"
          >
            <Button
              size="sm"

              aria-pressed={mobilePane === "problem"}
              onClick={() => {
                setMobilePane("problem");
                setFocus(false);
              }}
            >
              <FileCode2 size={14} />
              Problem
            </Button>
            <Button
              size="sm"

              aria-pressed={mobilePane === "code"}
              onClick={() => setMobilePane("code")}
            >
              <Code2 size={14} />
              Code
            </Button>
          </div>
          <Button
            size="sm"
            className="focus-toggle"
            aria-pressed={focus}
            onClick={() => setFocus((value) => !value)}
          >
            {focus ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            {focus ? "Show problem" : "Focus editor"}
          </Button>
          <Button
            size="sm"

            onClick={() => {
              void toggleFullscreen();
            }}
            aria-label={
              expanded
                ? "Exit fullscreen workspace"
                : "Enter fullscreen workspace"
            }
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{expanded ? "Exit fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
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
      {layoutNotice && (
        <div className="inline-warning" role="status">
          {layoutNotice}
        </div>
      )}
      <div
        ref={workspace}
        className="workspace"
        data-mobile-pane={mobilePane}
        style={{ "--problem-width": `${problemWidth}%` } as CSSProperties}
      >
        <Tabs className="problem-panel" value={tab} onValueChange={setTab}>
          <TabsList className="tab-bar" aria-label="Challenge content">
            <TabsTrigger value="problem">
              <FileCode2 size={15} />
              Problem
            </TabsTrigger>
            <TabsTrigger value="hints">
              <Lightbulb size={15} />
              Hints
            </TabsTrigger>
            <TabsTrigger value="notes">
              <NotebookPen size={15} />
              Notes
            </TabsTrigger>
            <TabsTrigger value="review">
              <ClipboardCheck size={15} />
              Review
            </TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="problem-scroll">
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
                <Button
                  disabled={hints === challenge.hints.length}
                  onClick={() => setHints((n) => n + 1)}
                >
                  {hints === challenge.hints.length
                    ? "All hints revealed"
                    : "Reveal next hint"}
                </Button>
              </div>
            ) : tab === "review" ? (
              <EngineeringReview challenge={challenge} />
            ) : (
              <div className="notes-content">
                <NotebookPen size={25} />
                <h2>Keep the reasoning.</h2>
                <p>
                  Capture the edge cases, trade-offs, or questions you want to
                  revisit.
                </p>
                <label htmlFor="engineering-notes">Engineering notes</label>
                <Textarea
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
          </TabsContent>
        </Tabs>
        <SplitHandle
          orientation="vertical"
          label="Resize problem panel"
          value={problemWidth}
          min={22}
          max={55}
          step={2}
          scale={100 / workspaceWidth}
          onChange={setProblemWidth}
        />
        <section className="code-panel">
          <div className="editor-container">
            <Suspense
              fallback={<Loading text="Loading local Python editor…" />}
            >
              <PythonEditor
                code={code}
                onChange={setCode}
                theme={theme}
                modelKey={challenge.version_id}
                draftSaved={draftSaved}
                onReset={() => {
                  if (
                    window.confirm(
                      "Reset your draft to the starter implementation?",
                    )
                  )
                    setCode(challenge.starter_code);
                }}
              />
            </Suspense>
          </div>
          <div className="execution-toolbar">
            <span className="shortcut">⌘ / Ctrl + Enter to run</span>
            <div>
              <Button disabled={!canExecute} onClick={() => perform("run")}>
                <Play size={14} />
                {execute.isPending && execute.variables === "run"
                  ? "Queuing…"
                  : "Run tests"}
              </Button>
              <Button
                variant="default"

                disabled={!canExecute}
                onClick={() => perform("submit")}
              >
                <Send size={14} />
                {execute.isPending && execute.variables === "submit"
                  ? "Queuing…"
                  : "Submit"}
              </Button>
            </div>
          </div>
          {execute.error && <ErrorBox error={execute.error} />}
          {resultsOpen && (
            <SplitHandle
              orientation="horizontal"
              label="Resize test results"
              value={Math.min(resultsSize, maxResultsSize)}
              min={120}
              max={maxResultsSize}
              step={20}
              reverse
              onChange={setResultsSize}
            />
          )}
          <Tabs
            value={bottomTab}
            onValueChange={(value) => {
              setBottomTab(value);
              setResultsOpen(true);
              setResultsSize(216);
            }}
            className={`results-panel ${resultsOpen ? "results-open" : "results-collapsed"}`}
            style={{
              height: resultsOpen ? Math.min(resultsSize, maxResultsSize) : 38,
            }}
          >
            <TabsList className="tab-bar" aria-label="Execution output">
              <TabsTrigger
                value="results"
                onClick={() => {
                  setResultsOpen(true);
                  setResultsSize(216);
                }}
              >
                <Check size={15} />
                Test results
              </TabsTrigger>
              <TabsTrigger
                value="history"
                onClick={() => {
                  setResultsOpen(true);
                  setResultsSize(216);
                }}
              >
                <History size={15} />
                History
              </TabsTrigger>
              <button
                className="results-collapse"
                aria-controls="execution-output-panel"
                aria-label={
                  resultsOpen ? "Collapse test results" : "Expand test results"
                }
                aria-expanded={resultsOpen}
                onClick={() => setResultsOpen((value) => !value)}
              >
                {resultsOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
                <span>{resultsOpen ? "Hide output" : "Show output"}</span>
              </button>
            </TabsList>
            <TabsContent
              value={bottomTab}
              className="results-scroll"
              id="execution-output-panel"
              role="tabpanel"
              hidden={!resultsOpen}
            >
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
                                setResultsOpen(true);
                                setResultsSize(216);
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
                        <Button
                          size="sm"

                          disabled={historyOffset === 0}
                          onClick={() =>
                            setHistoryOffset((n) => Math.max(0, n - 20))
                          }
                        >
                          Newer
                        </Button>
                        <Button
                          size="sm"

                          disabled={!history.data.has_more}
                          onClick={() => setHistoryOffset((n) => n + 20)}
                        >
                          Older
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
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
