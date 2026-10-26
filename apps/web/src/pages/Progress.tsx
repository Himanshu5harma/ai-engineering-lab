import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Layers,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";
import { WeekActivity } from "../components/WeekActivity";

export function Progress() {
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  const catalog = useQuery({
    queryKey: ["challenges"],
    queryFn: api.challenges,
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
  const tracks = [...new Set(catalog.data.items.map((c) => c.track))];
  const rank = [
    "Foundation",
    "Intermediate",
    "Advanced",
    "Senior / Production",
  ];
  return (
    <div className="page progress-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PROGRESS YOU CAN EXPLAIN</div>
          <h1>Build your engineering depth.</h1>
          <p>Follow your practice, revisit concepts, and keep the evidence.</p>
        </div>
        <Link className="button primary" to="/arena">
          Keep practicing
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="progress-summary">
        <div>
          <span className="metric-icon metric-blue">
            <CheckCircle2 size={19} />
          </span>
          <strong>
            {data.solved_slugs.length}
            <small> / {data.total_challenges}</small>
          </strong>
          <span>Challenges verified</span>
        </div>
        <div>
          <span className="metric-icon metric-purple">
            <Code2 size={19} />
          </span>
          <strong>{data.submissions}</strong>
          <span>Full submissions</span>
        </div>
        <div>
          <span className="metric-icon metric-green">
            <Target size={19} />
          </span>
          <strong>{data.runs}</strong>
          <span>Public test runs</span>
        </div>
      </div>
      <div className="progress-layout">
        <section className="track-detail-panel">
          <div className="section-title">
            <h2>Learning tracks</h2>
            <span className="subtle">
              {tracks.length} active {tracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          {tracks.map((track) => {
            const challenges = catalog.data.items
              .filter((c) => c.track === track)
              .sort(
                (a, b) =>
                  rank.indexOf(a.difficulty) - rank.indexOf(b.difficulty),
              );
            const solved = challenges.filter((c) =>
              data.solved_slugs.includes(c.slug),
            ).length;
            return (
              <article className="track-detail" key={track}>
                <div className="track-detail-header">
                  <span className="metric-icon metric-blue">
                    <Layers size={19} />
                  </span>
                  <div>
                    <h3>{track.replaceAll("-", " ")}</h3>
                    <p>
                      {solved} of {challenges.length} challenges verified
                    </p>
                  </div>
                  <span className="track-count">
                    {solved}/{challenges.length}
                  </span>
                </div>
                <div
                  className="progress-track"
                  role="meter"
                  aria-label={`${track} verified challenges`}
                  aria-valuemin={0}
                  aria-valuemax={challenges.length}
                  aria-valuenow={solved}
                >
                  <span
                    style={{ width: `${(solved / challenges.length) * 100}%` }}
                  />
                </div>
                <ol className="learning-steps">
                  {challenges.map((challenge, index) => {
                    const done = data.solved_slugs.includes(challenge.slug);
                    return (
                      <li key={challenge.slug}>
                        <span
                          className={`step-marker ${done ? "complete" : ""}`}
                        >
                          {done ? <Check size={14} /> : index + 1}
                        </span>
                        <div>
                          <Link to={`/arena/${challenge.slug}`}>
                            {challenge.title}
                          </Link>
                          <p>
                            {challenge.difficulty} ·{" "}
                            {challenge.tags.join(" · ")}
                          </p>
                        </div>
                        <span
                          className={`step-label ${done ? "complete" : ""}`}
                        >
                          {done ? "Verified" : "Ready to practice"}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <Link to={`/arena`} className="text-link">
                  Explore this track
                  <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </section>
        <aside>
          <WeekActivity days={data.weekly_activity} />
          <section className="evidence-card">
            <CheckCircle2 size={20} />
            <h2>Evidence over percentages.</h2>
            <p>
              A challenge is verified when a full submission passes on its
              current content version. Public test runs help you iterate.
            </p>
            <p>
              Completion is one piece of practice evidence. It does not certify
              mastery or interview readiness.
            </p>
            <Link to="/activity" className="text-link">
              Inspect your executions
              <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
      <p className="evidence-note">{data.evidence_note}</p>
    </div>
  );
}
