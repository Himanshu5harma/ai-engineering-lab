import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bookmark, FileCode2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type ChallengeSummary } from "../api/client";
import { useBookmarks } from "../hooks/useBookmarks";

export function FeaturedChallenge({
  challenge,
  continuing,
}: {
  challenge: ChallengeSummary;
  continuing: boolean;
}) {
  const detail = useQuery({
    queryKey: ["challenge", challenge.slug],
    queryFn: () => api.challenge(challenge.slug),
  });
  const { saved, toggle, error } = useBookmarks();
  return (
    <section className="continue-card featured-challenge">
      <div className="feature-copy">
        <div className="feature-kicker">
          <span className="section-label">
            {continuing ? "CONTINUE YOUR PRACTICE" : "RECOMMENDED FOR YOU"}
          </span>
          <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
        </div>
        <h2>{challenge.title}</h2>
        <p>{challenge.summary}</p>
        <div className="tag-row">
          {challenge.tags.map((tag) => (
            <Link
              to={`/arena?topic=${encodeURIComponent(tag)}`}
              className="tag"
              key={tag}
            >
              {tag}
            </Link>
          ))}
        </div>
        <div className="feature-actions">
          <Link to={`/arena/${challenge.slug}`} className="button primary">
            {continuing ? "Continue challenge" : "Start challenge"}
            <ArrowRight size={16} />
          </Link>
          <button
            className={`button bookmark-action ${saved.includes(challenge.slug) ? "is-saved" : ""}`}
            aria-label={`${saved.includes(challenge.slug) ? "Unsave" : "Save"} recommended challenge`}
            aria-pressed={saved.includes(challenge.slug)}
            onClick={() => toggle(challenge.slug)}
          >
            <Bookmark
              size={15}
              fill={saved.includes(challenge.slug) ? "currentColor" : "none"}
            />
            {saved.includes(challenge.slug) ? "Saved" : "Save for later"}
          </button>
        </div>
        {error && (
          <p className="inline-warning" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="feature-preview">
        <div className="preview-header">
          <span>
            <FileCode2 size={13} />
            solution.py
          </span>
          <span>Python</span>
        </div>
        <pre>
          {detail.data?.starter_code ||
            (detail.error
              ? "Starter preview unavailable. Open the challenge to retry."
              : "Loading starter code…")}
        </pre>
        <div className="preview-footer">
          <ShieldCheck size={14} />
          <span>
            {challenge.public_count} public tests
            {detail.data
              ? ` · ${detail.data.verification_count} total checks`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
