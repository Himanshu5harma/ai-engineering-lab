import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/primitives";
import { Button, IconButton } from "../../components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  ClipboardCheck,
  NotebookPen,
  Check,
  FileCode2,
  History,
  Lightbulb,
  Play,
  Send,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Code2,
  ListChecks,
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
import { TestCases } from "./TestCases";
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
  const [bottomTab, setBottomTab] = useState("cases");
  const [caseTab, setCaseTab] = useState("0");
  const [hints, setHints] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [historyOffset, setHistoryOffset] = useState(0);
  const [restoreError, setRestoreError] = useState<Error>();
  const workspace = useRef<HTMLDivElement>(null);
  const [mobilePane, setMobilePane] = useState("code");
  const [resultsOpen, setResultsOpen] = useState(true);
  const [problemWidth, setProblemWidth] = useState(43);
  const [resultsSize, setResultsSize] = useState(200);
  const [workspaceWidth, setWorkspaceWidth] = useState(1000);
  const [maxResultsSize, setMaxResultsSize] = useState(360);
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
      setResultsSize(200);
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
        Math.max(120, Math.min(360, entry.contentRect.height - 400)),
      );
    });
    observer.observe(workspace.current);
    return () => observer.disconnect();
  }, []);
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
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key === "Enter"
      ) {
        // Find/Replace and modal forms retain their own keyboard actions.
        if (
          event.target instanceof Element &&
          event.target.closest('dialog, [role="dialog"]')
        )
          return;
        event.preventDefault();
        // Monaco also binds these keys to insert-line commands.
        event.stopPropagation();
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
    <div className="arena-page arena-workbench">
      <div className="arena-heading">
        <div className="arena-identity">
          <IconButton
            asChild
            aria-label="All challenges"
            title="All challenges"
          >
            <Link to="/arena">
              <ArrowLeft size={16} />
            </Link>
          </IconButton>
          <div className="arena-heading-title">
            {challenge.curriculum_id && (
              <span className="challenge-id">{challenge.curriculum_id}</span>
            )}
            <h1 title={challenge.title}>{challenge.title}</h1>
            <span
              className={`difficulty ${challenge.difficulty.toLowerCase()}`}
            >
              {challenge.difficulty}
            </span>
          </div>
        </div>
        <div className="mobile-workspace-switch" aria-label="Workspace view">
          <Button
            size="sm"
            variant={mobilePane === "problem" ? "secondary" : "ghost"}
            aria-pressed={mobilePane === "problem"}
            onClick={() => setMobilePane("problem")}
          >
            <FileCode2 size={14} />
            Description
          </Button>
          <Button
            size="sm"
            variant={mobilePane === "code" ? "secondary" : "ghost"}
            aria-pressed={mobilePane === "code"}
            onClick={() => setMobilePane("code")}
          >
            <Code2 size={14} />
            Code
          </Button>
        </div>
        <div className="workspace-view-controls">
          <IconButton
            className="workspace-save"
            aria-label={`${saved.includes(challenge.slug) ? "Unsave" : "Save"} this challenge`}
            title={
              saved.includes(challenge.slug)
                ? "Unsave challenge"
                : "Save challenge"
            }
            aria-pressed={saved.includes(challenge.slug)}
            onClick={() => toggle(challenge.slug)}
          >
            <Bookmark
              size={16}
              fill={saved.includes(challenge.slug) ? "currentColor" : "none"}
            />
          </IconButton>
          <div
            className="execution-toolbar"
            role="toolbar"
            aria-label="Execution controls"
          >
            <Button
              size="sm"
              aria-label="Run tests"
              disabled={!canExecute}
              title="Run public tests · Cmd/Ctrl+Enter"
              onClick={() => perform("run")}
            >
              <Play size={14} />
              {execute.isPending && execute.variables === "run"
                ? "Queuing…"
                : "Run"}
            </Button>
            <Button
              size="sm"
              variant="default"
              aria-label="Submit"
              disabled={!canExecute}
              title="Submit full verification · Cmd/Ctrl+Shift+Enter"
              onClick={() => perform("submit")}
            >
              <Send size={14} />
              {execute.isPending && execute.variables === "submit"
                ? "Queuing…"
                : "Submit"}
            </Button>
          </div>
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
      {execute.error && <ErrorBox error={execute.error} />}
      <div
        ref={workspace}
        className="workspace"
        data-mobile-pane={mobilePane}
        style={{ "--problem-width": `${problemWidth}%` } as CSSProperties}
      >
        <Tabs className="problem-panel" value={tab} onValueChange={setTab}>
          <TabsList
            variant="line"
            className="tab-bar pane-tabs"
            aria-label="Challenge content"
          >
            <TabsTrigger value="problem">
              <FileCode2 size={15} />
              Description
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
          min={28}
          max={60}
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
              setResultsSize(200);
            }}
            className={`results-panel ${resultsOpen ? "results-open" : "results-collapsed"}`}
            style={{
              height: resultsOpen ? Math.min(resultsSize, maxResultsSize) : 42,
            }}
          >
            <TabsList
              variant="line"
              className="tab-bar pane-tabs"
              aria-label="Execution output"
            >
              <TabsTrigger
                value="cases"
                onClick={() => {
                  setResultsOpen(true);
                  setResultsSize(200);
                }}
              >
                <ListChecks size={15} />
                Test cases
              </TabsTrigger>
              <TabsTrigger
                value="results"
                onClick={() => {
                  setResultsOpen(true);
                  setResultsSize(200);
                }}
              >
                <Check size={15} />
                Test results
              </TabsTrigger>
              <TabsTrigger
                value="history"
                onClick={() => {
                  setResultsOpen(true);
                  setResultsSize(200);
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
              {bottomTab === "cases" ? (
                <TestCases
                  cases={challenge.public_cases}
                  value={caseTab}
                  onValueChange={setCaseTab}
                />
              ) : bottomTab === "results" ? (
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
                                setResultsSize(200);
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
    </div>
  );
}
