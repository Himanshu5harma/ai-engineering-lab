import { Card } from "../components/ui/primitives";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Code2,
  Layers,
  Target,
  TerminalSquare,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, statusLabel } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";
import { FeaturedChallenge } from "../components/FeaturedChallenge";
import { WeekActivity } from "../components/WeekActivity";
import { CurriculumOverview } from "../components/CurriculumOverview";
import { useBookmarks } from "../hooks/useBookmarks";

export function Dashboard() {
  const [activityType, setActivityType] = useState("all");
  const { saved } = useBookmarks();
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  const catalog = useQuery({
    queryKey: ["challenges"],
    queryFn: api.challenges,
  });
  const execution = useQuery({
    queryKey: ["availability"],
    queryFn: api.availability,
    refetchInterval: 10000,
  });
  if (progress.isPending || catalog.isPending) return <Loading />;
  if (progress.error || catalog.error)
    return (
      <ErrorBox
        error={progress.error || catalog.error!}
        retry={() => {
          void progress.refetch();
          void catalog.refetch();
        }}
      />
    );
  const data = progress.data;
  const recent = data.recent_submissions[0];
  const lastChallenge = catalog.data.items.find(
    (c) =>
      c.slug === recent?.challenge_slug && !data.solved_slugs.includes(c.slug),
  );
  const next =
    lastChallenge ||
    catalog.data.items.find((c) => !data.solved_slugs.includes(c.slug)) ||
    catalog.data.items[0];
  const topics = [...new Set(catalog.data.items.flatMap((c) => c.tags))];
  const activities = data.recent_submissions.filter(
    (s) => activityType === "all" || s.action === activityType,
  );
  const savedCount = catalog.data.items.filter((c) =>
    saved.includes(c.slug),
  ).length;
  return (
    <div className="page dashboard">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR AI ENGINEERING WORKBENCH</div>
          <h1>Learn by building.</h1>
          <p>Turn concepts into working code. Make every attempt count.</p>
        </div>
        <Link className="button primary heading-link" to="/arena">
          <Code2 size={16} />
          Explore challenges
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="overview-metrics">
        <Link to="/progress">
          <span className="metric-icon metric-blue">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <span>Verified challenges</span>
            <strong>
              {data.solved_slugs.length}
              <small> / {data.total_challenges}</small>
            </strong>
          </div>
          <ChevronRight size={15} />
        </Link>
        <Link to="/activity">
          <span className="metric-icon metric-purple">
            <TerminalSquare size={18} />
          </span>
          <div>
            <span>Submissions</span>
            <strong>{data.submissions}</strong>
          </div>
          <ChevronRight size={15} />
        </Link>
        <Link to="/activity">
          <span className="metric-icon metric-green">
            <Target size={18} />
          </span>
          <div>
            <span>Public test runs</span>
            <strong>{data.runs}</strong>
          </div>
          <ChevronRight size={15} />
        </Link>
        <Link to="/arena?status=saved">
          <span className="metric-icon metric-amber">
            <Bookmark size={18} />
          </span>
          <div>
            <span>Saved for later</span>
            <strong>{savedCount}</strong>
          </div>
          <ChevronRight size={15} />
        </Link>
      </div>
      <div className="learning-layout">
        <div className="learning-main">
          {next && (
            <FeaturedChallenge challenge={next} continuing={!!lastChallenge} />
          )}
          <CurriculumOverview />
          <section className="topic-explorer">
            <div className="section-title">
              <h2>Explore a concept</h2>
              <Link to="/arena" className="text-link">
                View library
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="topic-chips">
              {topics.map((topic) => (
                <Link
                  key={topic}
                  to={`/arena?topic=${encodeURIComponent(topic)}`}
                >
                  <span>{topic}</span>
                  <small>
                    {
                      catalog.data.items.filter((c) => c.tags.includes(topic))
                        .length
                    }
                  </small>
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </section>
          <section className="practice-collection">
            <div className="section-title">
              <h2>Your practice library</h2>
              <span className="subtle">{catalog.data.total} available</span>
            </div>
            <div className="practice-list">
              {catalog.data.items.slice(0, 4).map((challenge, index) => (
                <Link
                  to={`/arena/${challenge.slug}`}
                  key={challenge.slug}
                  className="practice-row"
                >
                  <span className="row-number">
                    {challenge.curriculum_id ||
                      String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="practice-row-copy">
                    <h3>{challenge.title}</h3>
                    <p>
                      {challenge.difficulty} · {challenge.public_count} public
                      tests
                    </p>
                  </div>
                  <div className="practice-row-meta">
                    {data.solved_slugs.includes(challenge.slug) && (
                      <span className="solved">
                        <CheckCircle2 size={14} />
                        Verified
                      </span>
                    )}
                    <ChevronRight size={17} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="recent-section">
            <div className="section-title">
              <h2>Recent activity</h2>
              <Link to="/activity" className="text-link">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
            <div
              className="activity-type-tabs"
              aria-label="Recent activity type"
            >
              {[
                ["all", "All activity"],
                ["submit", "Submissions"],
                ["run", "Test runs"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={activityType === value}
                  onClick={() => setActivityType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {activities.length ? (
              <div className="recent-list">
                {activities.map((s) => (
                  <Link key={s.id} to={`/activity?execution=${s.id}`}>
                    <span className={`status-dot ${s.status}`} />
                    <div>
                      <strong>
                        {catalog.data.items.find(
                          (c) => c.slug === s.challenge_slug,
                        )?.title || s.challenge_slug}
                      </strong>
                      <small>
                        {s.action === "run" ? "Public run" : "Full submission"}{" "}
                        · {new Date(s.created_at).toLocaleString()}
                      </small>
                    </div>
                    <span className={`status-text ${s.status}`}>
                      {statusLabel(s.status)}
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <TerminalSquare size={23} />
                <strong>
                  No recent{" "}
                  {activityType === "all"
                    ? "activity"
                    : activityType === "submit"
                      ? "submissions"
                      : "test runs"}
                  .
                </strong>
                <p>Open a challenge and put an idea to the test.</p>
              </div>
            )}
          </section>
        </div>
        <aside className="learning-aside" aria-label="Practice progress">
          <Card className="panel learning-track">
            <div className="section-title">
              <h2>Your first 12 challenges</h2>
              <span className="track-icon">
                <Layers size={16} />
              </span>
            </div>
            <span className="track-category">FOUNDATIONS TO PRODUCTION</span>
            <h3>Build the core AI toolkit.</h3>
            <p>
              Vectors, chunking, evidence security, evaluation, resilience and
              safe tools.
            </p>
            <div className="track-evidence">
              <strong>
                {data.solved_slugs.length} of {data.total_challenges}
              </strong>
              <span>challenges verified</span>
            </div>
            <div
              className="progress-track"
              role="meter"
              aria-label="Track completion"
              aria-valuemin={0}
              aria-valuemax={Math.max(data.total_challenges, 1)}
              aria-valuenow={data.solved_slugs.length}
            >
              <span
                style={{
                  width: `${data.total_challenges ? (data.solved_slugs.length / data.total_challenges) * 100 : 0}%`,
                }}
              />
            </div>
            <Link to="/progress" className="text-link">
              View learning progress
              <ArrowRight size={14} />
            </Link>
          </Card>
          <WeekActivity days={data.weekly_activity} />
          <Card className="panel environment-panel">
            <div className="section-title">
              <h2>Execution environment</h2>
              <span
                className={`runtime-pill ${execution.data?.available ? "ready" : ""}`}
              >
                <i />
                {execution.data?.available ? "Ready" : "Unavailable"}
              </span>
            </div>
            <div className="runtime-facts">
              <div>
                <span>Runtime</span>
                <strong>Python 3.12</strong>
              </div>
              <div>
                <span>Resources</span>
                <strong>1 CPU · 128 MiB</strong>
              </div>
              <div>
                <span>Network</span>
                <strong>Disabled</strong>
              </div>
            </div>
            <p>
              {execution.error?.message ||
                execution.data?.message ||
                "Checking local worker…"}
            </p>
          </Card>
        </aside>
      </div>
      <p className="evidence-note">{data.evidence_note}</p>
    </div>
  );
}
