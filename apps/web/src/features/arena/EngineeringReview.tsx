import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Save } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useBeforeUnload } from "react-router-dom";
import { useRecoverableDraft } from "../../hooks/useRecoverableDraft";
import { RecoveryCopies } from "../../components/RecoveryCopies";
import { Button } from "../../components/ui/button";
import { Textarea, StatusIndicator } from "../../components/ui/primitives";
import { downloadFile } from "../design/export";
import Markdown from "react-markdown";
import { curriculumApi, type Challenge, type Review } from "../../api/client";
import { ErrorBox, Loading } from "../../components/Feedback";

export function EngineeringReview({ challenge }: { challenge: Challenge }) {
  const review = useQuery({
    queryKey: ["review", challenge.version_id],
    queryFn: () => curriculumApi.review(challenge.slug),
  });
  if (review.isPending) return <Loading text="Loading engineering review…" />;
  if (review.error)
    return (
      <ErrorBox
        error={review.error}
        retry={() => {
          void review.refetch();
        }}
      />
    );
  return (
    <ReviewForm
      key={challenge.version_id}
      challenge={challenge}
      initial={review.data}
    />
  );
}
function ReviewForm({
  challenge,
  initial,
}: {
  challenge: Challenge;
  initial: Review;
}) {
  const serverValue = useMemo(
    () => ({ completed_tasks: initial.completed_tasks, notes: initial.notes }),
    [initial],
  );
  const draft = useRecoverableDraft(
    "review",
    challenge.version_id,
    serverValue,
    initial.revision,
    validReviewDraft,
  );
  const { completed_tasks: completed, notes } = draft.value;
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const cache = useQueryClient();
  useBeforeUnload((event) => {
    if (draft.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  const save = useMutation({
    mutationFn: async () => {
      if (busy.current) throw new Error("A save is already in progress");
      busy.current = true;
      const snapshot = draft.value;
      try {
        const data = await curriculumApi.saveReview(
          challenge.slug,
          challenge.version_id,
          snapshot.completed_tasks,
          snapshot.notes,
          draft.revision,
        );
        const clean = draft.saved(snapshot, data.revision);
        cache.setQueryData<Review>(
          ["review", challenge.version_id],
          (current) =>
            !current || current.revision <= data.revision ? data : current,
        );
        void cache.invalidateQueries({ queryKey: ["progress"] });
        setNotice(
          clean
            ? "Review saved in PostgreSQL"
            : "Earlier review snapshot saved; newer edits are unsaved.",
        );
        return data;
      } finally {
        busy.current = false;
      }
    },
  });
  function toggle(id: Review["completed_tasks"][number]) {
    draft.setValue((current) => ({
      ...current,
      completed_tasks: current.completed_tasks.includes(id)
        ? current.completed_tasks.filter((key) => key !== id)
        : [...current.completed_tasks, id],
    }));
    setNotice("");
  }
  async function loadSaved() {
    const snapshot = draft.value;
    const data = await curriculumApi.review(challenge.slug);
    if (data.version_id !== challenge.version_id)
      throw new Error(
        "Challenge content changed. Your local review is preserved.",
      );
    const loaded = draft.load(
      { completed_tasks: data.completed_tasks, notes: data.notes },
      data.revision,
      snapshot,
    );
    if (!loaded) {
      setNotice(
        "Your review changed while loading. Newer edits were preserved.",
      );
      return;
    }
    cache.setQueryData<Review>(["review", challenge.version_id], (current) =>
      !current || current.revision <= data.revision ? data : current,
    );
    setNotice(
      "Loaded the saved review; your earlier copy is available in the exported file.",
    );
  }
  return (
    <div className="engineering-review">
      <RecoveryCopies
        copies={draft.recoveries}
        restore={(copy) => {
          if (draft.dirty)
            downloadFile(
              "engineering-review-before-recovery.json",
              JSON.stringify(
                {
                  version_id: challenge.version_id,
                  revision: draft.revision,
                  ...draft.value,
                },
                null,
                2,
              ),
              "application/json",
            );
          draft.restore(copy);
        }}
      />
      {draft.newerSavedRevision && (
        <p className="ui-alert">
          A newer saved review is available. Your local edits are preserved.
        </p>
      )}
      <div className="review-intro">
        <ClipboardCheck size={23} />
        <h2>Defend the implementation.</h2>
        <p>
          A passing suite proves behavior under its test contract. Record your
          production reasoning separately.
        </p>
      </div>
      <div className="review-evidence">
        <span className={initial.code_verified ? "verified" : ""}>
          <CheckCircle2 size={14} />
          {initial.code_verified
            ? "Code verified by full submission"
            : "Full code verification still pending"}
        </span>
        <span>
          {completed.length}/{initial.tasks.length} self-review tasks
        </span>
      </div>
      {challenge.production_review && (
        <div className="markdown review-variant">
          <Markdown>{challenge.production_review}</Markdown>
        </div>
      )}
      <fieldset className="review-checklist" disabled={save.isPending}>
        <legend>Engineering self-review</legend>
        {initial.tasks.map((task) => (
          <label key={task.id}>
            <input
              type="checkbox"
              checked={completed.includes(task.id)}
              onChange={() => toggle(task.id)}
            />
            <span>
              <strong>{task.title}</strong>
              <small>{task.description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="review-notes-label" htmlFor="review-notes">
        Reasoning, evidence, and remaining questions
      </label>
      <Textarea
        id="review-notes"
        value={notes}
        maxLength={8000}
        onChange={(event) => {
          draft.setValue((current) => ({
            ...current,
            notes: event.target.value,
          }));
          setNotice("");
        }}
        placeholder="Record complexity, security boundaries, failure evidence and trade-offs…"
      />
      <div className="review-save">
        <StatusIndicator tone={draft.dirty ? "warning" : "success"}>
          {draft.dirty
            ? `Unsaved review changes${draft.storageAvailable ? " · browser backup" : " · backup unavailable"}`
            : notice ||
              (initial.updated_at
                ? "Review saved in PostgreSQL"
                : "No self-review recorded yet")}
        </StatusIndicator>
        <Button
          variant="default"
          disabled={save.isPending || !draft.dirty}
          onClick={() => save.mutate()}
        >
          <Save size={14} />
          {save.isPending ? "Saving…" : "Save review"}
        </Button>
      </div>
      {save.error && (
        <>
          <ErrorBox error={save.error} />
          <Button
            onClick={() =>
              downloadFile(
                "engineering-review.json",
                JSON.stringify(
                  {
                    version_id: challenge.version_id,
                    revision: draft.revision,
                    ...draft.value,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Export local review
          </Button>
          <Button
            onClick={() => {
              downloadFile(
                "engineering-review.json",
                JSON.stringify(draft.value, null, 2),
                "application/json",
              );
              void loadSaved().catch(() =>
                setNotice(
                  "Could not load the saved review; local work is preserved.",
                ),
              );
            }}
          >
            Export and load saved review
          </Button>
        </>
      )}
      {!draft.storageAvailable && (
        <p role="alert">
          Browser recovery is unavailable. Keep this tab open and save or export
          your review.
        </p>
      )}
      <p className="review-disclaimer">{initial.notice}</p>
    </div>
  );
}

type ReviewDraft = {
  completed_tasks: Review["completed_tasks"];
  notes: string;
};
function validReviewDraft(value: unknown): value is ReviewDraft {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.notes === "string" &&
    data.notes.length <= 8000 &&
    Array.isArray(data.completed_tasks) &&
    data.completed_tasks.every((key) =>
      [
        "performance",
        "security",
        "failure_analysis",
        "tradeoffs",
        "code_quality",
        "interview",
      ].includes(key),
    )
  );
}
