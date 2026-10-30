import { Textarea } from "./ui/primitives";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { Check, ClipboardCheck, Copy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, curriculumApi } from "../api/client";
import { ErrorBox, Loading } from "./Feedback";

export function FirstReleasePath() {
  const plan = useQuery({
    queryKey: ["curriculum"],
    queryFn: curriculumApi.plan,
  });
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  const [copyState, setCopyState] = useState("");
  if (plan.isPending || progress.isPending)
    return <Loading text="Loading the first twelve challenges…" />;
  if (plan.error || progress.error)
    return (
      <ErrorBox
        error={plan.error || progress.error!}
        retry={() => {
          void plan.refetch();
          void progress.refetch();
        }}
      />
    );
  const entries = plan.data.modules.flatMap((module) => module.entries);
  const ordered = plan.data.first_release.map((id) =>
    entries.find((entry) => entry.id === id)!,
  );
  const verified = ordered.filter(
    (entry) => entry.slug && progress.data.solved_slugs.includes(entry.slug),
  ).length;
  const reviewed = ordered.filter(
    (entry) =>
      entry.slug && progress.data.review_completed_slugs?.includes(entry.slug),
  ).length;
  const checklist = [
    "AI Engineering Lab — first 12 challenges",
    ...ordered.map(
      (entry) =>
        `- [${entry.slug && progress.data.solved_slugs.includes(entry.slug) ? "x" : " "}] ${entry.id} — ${entry.title}`,
    ),
  ].join("\n");
  async function copy() {
    try {
      await navigator.clipboard.writeText(checklist);
      setCopyState("Checklist copied");
    } catch {
      setCopyState("Select and copy the checklist below");
    }
  }
  return (
    <section className="first-release-path">
      <div className="first-release-heading">
        <div>
          <span className="eyebrow">THE FIRST RELEASE</span>
          <h2>Your first 12 challenges</h2>
          <p>
            {verified}/12 code verified <span>·</span> {reviewed}/12 engineering
            self-reviews recorded
          </p>
        </div>
        <Button
          size="sm"

          onClick={() => {
            void copy();
          }}
        >
          <Copy size={13} />
          Copy checklist
        </Button>
      </div>
      <ol className="first-release-steps">
        {ordered.map((entry, index) => {
          const done =
            !!entry.slug && progress.data.solved_slugs.includes(entry.slug);
          const review =
            !!entry.slug &&
            !!progress.data.review_completed_slugs?.includes(entry.slug);
          return (
            <li key={entry.id}>
              <span className={`path-number ${done ? "complete" : ""}`}>
                {done ? (
                  <Check size={13} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span className="curriculum-code">{entry.id}</span>
              <div>
                <Link
                  to={
                    entry.slug && entry.available
                      ? `/arena/${entry.slug}`
                      : "/curriculum"
                  }
                >
                  {entry.title}
                </Link>
                <small>{entry.track_title}</small>
              </div>
              <span className={`path-code-status ${done ? "verified" : ""}`}>
                {done ? "Code verified" : entry.available ? "Ready" : "Planned"}
              </span>
              {entry.slug && entry.available && (
                <Link
                  className={`path-review-link ${review ? "complete" : ""}`}
                  to={`/arena/${entry.slug}?tab=review`}
                >
                  <ClipboardCheck size={13} />
                  {review ? "Self-review recorded" : "Engineering review"}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <div className="copy-status" role="status">
        {copyState}
      </div>
      {copyState === "Select and copy the checklist below" && (
        <Textarea
          className="copy-checklist"
          aria-label="Copyable learning checklist"
          readOnly
          value={checklist}
        />
      )}
    </section>
  );
}
