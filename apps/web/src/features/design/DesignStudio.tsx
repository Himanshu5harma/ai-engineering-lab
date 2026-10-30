import "./studio.css";
import { useMemo, useRef, useState, type SetStateAction } from "react";
import { useRecoverableDraft } from "../../hooks/useRecoverableDraft";
import { RecoveryCopies } from "../../components/RecoveryCopies";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Textarea, Badge, Select } from "../../components/ui/primitives";
import { PreviousDrafts } from "./PreviousDrafts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  GitBranch,
  Save,
} from "lucide-react";
import { Link, useBeforeUnload, useParams } from "react-router-dom";
import { designApi } from "../../api/client";
import { ErrorBox, Loading } from "../../components/Feedback";
import { ArchitectureCanvas } from "./ArchitectureCanvas";
import { designMarkdown, diagramSvg, downloadFile } from "./export";
import {
  completeness,
  deliverables,
  type DesignChallenge,
  type DesignDocument,
  type Deliverable,
  type Rating,
} from "./types";

export function DesignStudio({ theme }: { theme: string }) {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["design", slug],
    queryFn: () => designApi.challenge(slug),
  });
  if (query.isPending) return <Loading />;
  if (query.error)
    return (
      <ErrorBox
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return <DesignSession key={slug} incoming={query.data} theme={theme} />;
}

function DesignSession({
  incoming,
  theme,
}: {
  incoming: DesignChallenge;
  theme: string;
}) {
  const [opened, setOpened] = useState(incoming);
  const changed = incoming.version_id !== opened.version_id;
  return (
    <DesignEditor
      key={opened.version_id}
      challenge={changed ? opened : incoming}
      theme={theme}
      contentChanged={changed}
      openCurrent={() => setOpened(incoming)}
    />
  );
}

function readBackup(
  key: string,
): { revision: number; document: DesignDocument } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    // Only restore a local draft with the expected document shape.
    if (
      saved &&
      Number.isInteger(saved.revision) &&
      validDesignDraft({
        document: saved.document,
        source_version_id: null,
        source_revision: null,
      })
    )
      return saved;
  } catch {
    /* PostgreSQL remains available if browser storage is unavailable. */
  }
  return null;
}

function DesignEditor({
  challenge,
  theme,
  contentChanged,
  openCurrent,
}: {
  challenge: DesignChallenge;
  theme: string;
  contentChanged: boolean;
  openCurrent: () => void;
}) {
  const cache = useQueryClient();
  const serverValue = useMemo(
    () => ({
      document: challenge.workspace.document,
      source_version_id: challenge.workspace.source_version_id,
      source_revision: challenge.workspace.source_revision,
    }),
    [challenge.workspace],
  );
  const draft = useRecoverableDraft(
    "design",
    challenge.version_id,
    serverValue,
    challenge.workspace.revision,
    validDesignDraft,
  );
  const { document } = draft.value;
  const { revision, dirty, storageAvailable } = draft;
  const status = challenge.workspace.status;
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Deliverable | "review">("diagram");
  const [briefTab, setBriefTab] = useState("brief");
  const [briefOpen, setBriefOpen] = useState(() => window.innerWidth >= 1000);
  const [previousOpen, setPreviousOpen] = useState(false);
  const previousButton = useRef<HTMLButtonElement>(null);
  const [backup, setBackup] = useState(() =>
    readBackup(`ael-design-draft-${challenge.version_id}`),
  );
  const checks = completeness(document);
  const complete = Object.values(checks).filter(Boolean).length;
  function setDocument(update: SetStateAction<DesignDocument>) {
    draft.setValue((current) => ({
      ...current,
      document:
        typeof update === "function" ? update(current.document) : update,
    }));
    setNotice("");
  }
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  async function save(action: "save" | "submit_for_review") {
    if (busy.current) return;
    const snapshot = draft.value;
    const source =
      snapshot.source_version_id && snapshot.source_revision
        ? {
            source_version_id: snapshot.source_version_id,
            source_revision: snapshot.source_revision,
          }
        : undefined;
    const requestBytes = new TextEncoder().encode(
      JSON.stringify({
        version_id: challenge.version_id,
        revision,
        document,
        action,
        ...source,
      }),
    ).length;
    if (requestBytes > 80000) {
      setError(
        "This draft exceeds the 80 KB save limit. Export your changes, then shorten notes or remove components.",
      );
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await designApi.save(
        challenge.slug,
        challenge.version_id,
        revision,
        snapshot.document,
        action,
        source,
      );
      const clean = draft.saved(snapshot, result.revision);
      cache.setQueryData<DesignChallenge>(
        ["design", challenge.slug],
        (current) =>
          current?.version_id === challenge.version_id &&
          current.workspace.revision <= result.revision
            ? { ...current, workspace: result }
            : current,
      );
      void cache.invalidateQueries({ queryKey: ["designs"] });
      setNotice(
        !clean
          ? "Earlier snapshot saved. Your newer edits still need saving."
          : action === "save"
            ? "Draft saved in PostgreSQL"
            : "Saved and marked ready for engineering review",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save your design",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function loadSaved() {
    if (busy.current) return;
    // Keep a portable copy before replacing any unsaved local state.
    exportJson();
    const snapshot = draft.value;
    busy.current = true;
    setSaving(true);
    try {
      const result = await designApi.challenge(challenge.slug);
      if (result.version_id !== challenge.version_id) {
        setError(
          "Exercise content changed. Your draft was exported; reload to access the current exercise and previous drafts.",
        );
        return;
      }
      const loaded = draft.load(
        {
          document: result.workspace.document,
          source_version_id: result.workspace.source_version_id,
          source_revision: result.workspace.source_revision,
        },
        result.workspace.revision,
        snapshot,
      );
      if (!loaded) {
        setError(
          "Your draft changed while loading. Newer edits were preserved. Export and load again when ready.",
        );
        return;
      }
      cache.setQueryData(["design", challenge.slug], result);
      setError("");
      setNotice("Loaded the latest saved draft");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load the saved draft",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function exportJson() {
    downloadFile(
      `${challenge.id}-design.json`,
      JSON.stringify(
        {
          schema_version: 1,
          challenge: challenge.slug,
          version_id: challenge.version_id,
          revision,
          source_version_id: draft.value.source_version_id,
          source_revision: draft.value.source_revision,
          document,
        },
        null,
        2,
      ),
      "application/json",
    );
  }
  return (
    <div className={`design-studio ${briefOpen ? "brief-open" : ""}`}>
      <header className="design-studio-heading">
        <div className="design-identity">
          <Link className="back-link" to="/design">
            <ArrowLeft size={14} />
            All design challenges
          </Link>
          <h1 title={challenge.title}>
            <Badge>{challenge.id}</Badge>
            {challenge.title}
          </h1>
        </div>
        <div className="design-save-actions">
          <span role="status">
            {saving
              ? "Saving…"
              : dirty
                ? `Unsaved changes${storageAvailable ? " · browser backup" : ""}`
                : revision
                  ? `Saved · revision ${revision}`
                  : "New design"}
          </span>
          <Button
            aria-expanded={briefOpen}
            aria-controls="design-instructions"
            onClick={() => setBriefOpen((value) => !value)}
          >
            {briefOpen ? "Hide brief" : "Show brief"}
          </Button>
          <Button ref={previousButton} onClick={() => setPreviousOpen(true)}>
            Previous drafts
            {challenge.previous_draft_count
              ? ` (${challenge.previous_draft_count})`
              : ""}
          </Button>
          <Button
            variant="default"
            disabled={saving || (!dirty && revision > 0 && status === "draft")}
            onClick={() => {
              void save("save");
            }}
          >
            <Save size={15} />
            Save draft
          </Button>
        </div>
      </header>
      <PreviousDrafts
        challenge={challenge}
        open={previousOpen}
        onOpenChange={setPreviousOpen}
        returnFocus={previousButton}
        carry={(workspace) => {
          if (dirty || revision > 0) exportJson();
          const ratings = Object.fromEntries(
            Object.entries(workspace.document.ratings).filter(([key]) =>
              challenge.rubric.some((criterion) => criterion.id === key),
            ),
          );
          draft.setValue({
            document: { ...workspace.document, ratings },
            source_version_id: workspace.version_id,
            source_revision: workspace.revision,
          });
          setNotice(
            "Previous work copied into this draft. Review it against the current brief, then Save draft. The original is preserved.",
          );
          setPreviousOpen(false);
        }}
      />
      {contentChanged && (
        <div className="ui-alert">
          Exercise content changed. Your current work remains open.
          <Button
            onClick={() => {
              exportJson();
              openCurrent();
            }}
          >
            Export and open current exercise
          </Button>
        </div>
      )}
      <RecoveryCopies
        copies={draft.recoveries}
        restore={(copy) => {
          if (dirty) exportJson();
          draft.restore(copy);
        }}
      />
      {draft.newerSavedRevision && (
        <p className="ui-alert">
          A newer saved revision is available. Your unsaved changes and base
          revision are preserved.
        </p>
      )}
      {draft.value.source_version_id && (
        <p className="design-provenance">
          Carried from content{" "}
          {draft.value.source_version_id.split(":")[1]?.slice(0, 8)} · source
          revision {draft.value.source_revision}. Original retained in Previous
          drafts.
        </p>
      )}
      {backup &&
        JSON.stringify(backup.document) !==
          JSON.stringify(challenge.workspace.document) && (
          <div className="design-recovery">
            <p>
              A browser draft is available. It may contain changes that were not
              saved to PostgreSQL.
            </p>
            <Button
              onClick={() => {
                draft.restore({
                  key: "legacy",
                  value: {
                    document: backup.document,
                    source_version_id: null,
                    source_revision: null,
                  },
                  revision: backup.revision,
                  baseline: JSON.stringify(serverValue),
                  updatedAt: new Date().toISOString(),
                });
                setBackup(null);
                setNotice(
                  "Browser draft restored. Export it if another tab has a newer saved revision.",
                );
              }}
            >
              Restore browser draft
            </Button>
            <button
              className="text-link"
              onClick={() => {
                setBackup(null);
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      {error && (
        <div className="design-save-error" role="alert">
          <p>{error}</p>
          <div>
            <Button onClick={exportJson}>
              <Download size={14} />
              Export current changes
            </Button>
            <Button
              disabled={saving}
              onClick={() => {
                void loadSaved();
              }}
            >
              Export and load saved draft
            </Button>
          </div>
        </div>
      )}
      {notice && (
        <p className="design-notice" role="status">
          <CheckCircle2 size={15} />
          {notice}
        </p>
      )}
      <div className="design-workspace-layout">
        <aside
          id="design-instructions"
          className="design-brief"
          hidden={!briefOpen}
        >
          <Tabs value={briefTab} onValueChange={setBriefTab}>
            <TabsList className="design-brief-tabs" aria-label="Exercise brief">
              {(["brief", "requirements", "scale"] as const).map((item) => (
                <TabsTrigger key={item} value={item}>
                  {item === "scale" ? "Scale & limits" : item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={briefTab} className="brief-tab-panel">
              {briefTab === "brief" ? (
                <div className="design-brief-content">
                  <span className="eyebrow">THE SCENARIO</span>
                  <p>{challenge.scenario}</p>
                  <h3>What to deliver</h3>
                  <ol>
                    {deliverables.map((item) => (
                      <li key={item.id}>
                        <button
                          className="text-link"
                          onClick={() => setTab(item.id)}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                  <p className="design-evidence-note">
                    The workload is synthetic. State assumptions, keep units
                    explicit, and distinguish a target from a measured result.
                  </p>
                </div>
              ) : (
                <div className="design-brief-content">
                  <h3>
                    {briefTab === "requirements"
                      ? "Functional requirements"
                      : "Scale assumptions"}
                  </h3>
                  <ol>
                    {(briefTab === "requirements"
                      ? challenge.requirements
                      : challenge.scale
                    ).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  {briefTab === "scale" && (
                    <>
                      <h3>Constraints</h3>
                      <ul>
                        {challenge.constraints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </aside>
        <Tabs
          className="design-work-area"
          value={tab}
          onValueChange={(value) => setTab(value as Deliverable | "review")}
        >
          <TabsList
            className="design-deliverable-tabs"
            aria-label="Design deliverables"
          >
            {deliverables.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {checks[item.id] && <Check size={13} />}
                {item.short}
              </TabsTrigger>
            ))}
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
          <TabsContent
            value={tab}
            className={`design-tab-panel design-tab-${tab}`}
          >
            {tab !== "review" && (
              <div className="design-prompt">
                <h2>{deliverables.find((item) => item.id === tab)?.title}</h2>
                <p>{challenge.prompts[tab]}</p>
              </div>
            )}
            {tab === "diagram" ? (
              <ArchitectureCanvas
                diagram={document.diagram}
                onChange={(diagram) =>
                  setDocument((current) => ({ ...current, diagram }))
                }
                theme={theme}
              />
            ) : tab === "review" ? (
              <div className="design-review">
                <div className="eyebrow">DEFEND YOUR DESIGN</div>
                <h2>Engineering self-review</h2>
                <p>{challenge.workspace.notice}</p>
                <div className="design-checklist">
                  {deliverables.map((item) => (
                    <button key={item.id} onClick={() => setTab(item.id)}>
                      <span
                        className={
                          checks[item.id] ? "check-done" : "check-pending"
                        }
                      >
                        {checks[item.id] ? <Check size={14} /> : "·"}
                      </span>
                      {item.title}
                      <small>{checks[item.id] ? "Drafted" : "Missing"}</small>
                    </button>
                  ))}
                </div>
                <p className="design-evidence-note">
                  Structural completeness requires two connected components and
                  text in all four written deliverables. It does not evaluate
                  the reasoning.
                </p>
                {challenge.rubric.map((item) => (
                  <article className="design-rubric-item" key={item.id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.question}</p>
                      <small>{item.evidence}</small>
                    </div>
                    <label>
                      My assessment
                      <Select
                        aria-label={`Self-review: ${item.title}`}
                        value={document.ratings[item.id] || "unreviewed"}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            ratings: {
                              ...current.ratings,
                              [item.id]: event.target.value as Rating,
                            },
                          }))
                        }
                      >
                        <option value="unreviewed">Not reviewed</option>
                        <option value="needs_work">Needs work</option>
                        <option value="defensible">I can defend this</option>
                      </Select>
                    </label>
                  </article>
                ))}
                <h3>Senior interview follow-ups</h3>
                <ol className="design-follow-ups">
                  {challenge.follow_ups.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <Button
                  variant="default"

                  disabled={complete < 5 || saving}
                  onClick={() => {
                    void save("submit_for_review");
                  }}
                >
                  <CheckCircle2 size={15} />
                  Mark ready for review
                </Button>
                <p className="design-evidence-note">
                  This saves your design for human review. Editing a ready
                  design and saving a draft returns it to draft status.
                </p>
              </div>
            ) : (
              <div className="design-writing">
                <label htmlFor={`design-${tab}`}>
                  {deliverables.find((item) => item.id === tab)?.title}
                </label>
                <Textarea
                  key={tab}
                  id={`design-${tab}`}
                  maxLength={6000}
                  value={document[tab]}
                  placeholder={
                    tab === "adr"
                      ? "Context\nDecision\nAlternatives considered\nConsequences and trade-offs\nWhen to revisit"
                      : "State the reasoning, assumptions and evidence. Reference components in your diagram."
                  }
                  onChange={(event) =>
                    setDocument((current) => ({
                      ...current,
                      [tab]: event.target.value,
                    }))
                  }
                />
                <span>
                  {document[tab].length}/6000 characters · saved with your draft
                </span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <footer className="design-workspace-footer">
        <span>
          <GitBranch size={15} />
          {complete}/5 deliverables drafted ·{" "}
          {dirty
            ? "Unsaved changes"
            : status === "ready_for_review"
              ? "Ready for review"
              : "Draft"}
        </span>
        <div>
          <Button
            disabled={!document.diagram.nodes.length}
            onClick={() =>
              downloadFile(
                `${challenge.id}-diagram.svg`,
                diagramSvg(document),
                "image/svg+xml",
              )
            }
          >
            <Download size={14} />
            Export SVG
          </Button>
          <Button
            onClick={() =>
              downloadFile(
                `${challenge.id}-design.md`,
                designMarkdown(challenge, document),
                "text/markdown",
              )
            }
          >
            <FileText size={14} />
            Export Markdown
          </Button>
          <Button onClick={exportJson}>
            <FileJson size={14} />
            Export JSON
          </Button>
        </div>
      </footer>
    </div>
  );
}

type DesignDraft = {
  document: DesignDocument;
  source_version_id: string | null;
  source_revision: number | null;
};
function validDesignDraft(value: unknown): value is DesignDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as DesignDraft;
  const doc = draft.document;
  return (
    !!doc &&
    [doc.flow, doc.capacity, doc.failures, doc.adr].every(
      (text) => typeof text === "string",
    ) &&
    !!doc.diagram &&
    Array.isArray(doc.diagram.nodes) &&
    Array.isArray(doc.diagram.edges) &&
    doc.diagram.nodes.every(
      (node) =>
        typeof node.id === "string" &&
        Number.isFinite(node.position?.x) &&
        Number.isFinite(node.position?.y) &&
        typeof node.data?.label === "string" &&
        typeof node.data?.notes === "string" &&
        [
          "client",
          "service",
          "model",
          "database",
          "queue",
          "cache",
          "external",
        ].includes(node.data?.kind),
    ) &&
    doc.diagram.edges.every(
      (edge) =>
        typeof edge.id === "string" &&
        typeof edge.source === "string" &&
        typeof edge.target === "string" &&
        typeof edge.label === "string",
    ) &&
    !!doc.ratings &&
    typeof doc.ratings === "object" &&
    Number.isFinite(doc.diagram.viewport?.zoom) &&
    (draft.source_version_id === null ||
      typeof draft.source_version_id === "string") &&
    (draft.source_revision === null || Number.isInteger(draft.source_revision))
  );
}
