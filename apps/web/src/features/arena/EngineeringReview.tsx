import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Save } from "lucide-react";
import { useState } from "react";
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
  const [completed, setCompleted] = useState(initial.completed_tasks);
  const [notes, setNotes] = useState(initial.notes);
  const [dirty, setDirty] = useState(false);
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      curriculumApi.saveReview(
        challenge.slug,
        challenge.version_id,
        completed,
        notes,
      ),
    onSuccess: (data) => {
      setDirty(false);
      cache.setQueryData(["review", challenge.version_id], data);
      void cache.invalidateQueries({ queryKey: ["progress"] });
    },
  });
  function toggle(id: string) {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((key) => key !== id)
        : [...current, id],
    );
    setDirty(true);
  }
  return (
    <div className="engineering-review">
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
      <textarea
        id="review-notes"
        value={notes}
        maxLength={8000}
        disabled={save.isPending}
        onChange={(event) => {
          setNotes(event.target.value);
          setDirty(true);
        }}
        placeholder="Record complexity, security boundaries, failure evidence and trade-offs…"
      />
      <div className="review-save">
        <span role="status">
          {dirty
            ? "Unsaved review changes"
            : save.isSuccess
              ? "Review saved in PostgreSQL"
              : initial.updated_at
                ? "Previously saved review"
                : "No self-review recorded yet"}
        </span>
        <button
          className="button primary"
          disabled={save.isPending || !dirty}
          onClick={() => save.mutate()}
        >
          <Save size={14} />
          {save.isPending ? "Saving…" : "Save review"}
        </button>
      </div>
      {save.error && <ErrorBox error={save.error} />}
      <p className="review-disclaimer">{initial.notice}</p>
    </div>
  );
}
