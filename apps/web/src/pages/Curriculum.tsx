import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";
import { curriculumApi } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";

export function Curriculum() {
  const plan = useQuery({
    queryKey: ["curriculum"],
    queryFn: curriculumApi.plan,
  });
  if (plan.isPending) return <Loading />;
  if (plan.error)
    return (
      <ErrorBox
        error={plan.error}
        retry={() => {
          void plan.refetch();
        }}
      />
    );
  const data = plan.data;
  const ready = data.modules.reduce(
    (count, module) => count + module.available_count,
    0,
  );
  return (
    <div className="page curriculum-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SENIOR APPLIED AI ENGINEERING</div>
          <h1>A curriculum built around real work.</h1>
          <p>
            {ready} ready now · {data.total_planned} planned across
            implementation, architecture, projects and debugging.
          </p>
        </div>
        <Link className="button primary" to="/progress">
          Your first 12
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="curriculum-guidance">
        <section>
          <CalendarDays size={19} />
          <h2>A suggested 20-hour week</h2>
          <div className="weekly-allocation">
            {data.modules.map((module) => (
              <div key={module.id}>
                <strong>{data.weekly_hours[module.id]}h</strong>
                <span>{module.title}</span>
              </div>
            ))}
          </div>
          <p>
            This is a planning baseline, not measured study time. Adjust the
            balance as projects become harder.
          </p>
        </section>
        <section>
          <ClipboardList size={19} />
          <h2>Build progressively</h2>
          <ol>
            <li>Twelve verified Coding Arena challenges.</li>
            <li>A working Design Studio with three architecture problems.</li>
            <li>A production RAG lab and a Debugging Arena.</li>
          </ol>
          <p>
            Twelve coding challenges and three design exercises are ready. Other
            entries remain on the roadmap.
          </p>
        </section>
      </div>
      {data.modules.map((module) => (
        <section
          className="curriculum-module-detail"
          key={module.id}
          id={module.id}
        >
          <div className="section-title">
            <h2>{module.title}</h2>
            <span className="subtle">
              {module.available_count} ready / {module.target_count} planned
              total
            </span>
          </div>
          {module.id === "system_design" && (
            <p className="module-deliverables">
              Each design requires: {data.design_deliverables.join(" · ")}.
            </p>
          )}
          <div className="curriculum-entry-grid">
            {module.entries.map((entry) => (
              <article
                key={entry.id}
                className={
                  entry.available ? "entry-available" : "entry-planned"
                }
              >
                <span className="curriculum-code">{entry.id}</span>
                <div>
                  <h3>{entry.title}</h3>
                  {entry.track_title && <small>{entry.track_title}</small>}
                  {entry.focus && <small>{entry.focus}</small>}
                </div>
                {entry.available && entry.slug ? (
                  <Link
                    className="text-link"
                    to={`/${module.id === "system_design" ? "design" : "arena"}/${entry.slug}`}
                  >
                    <CheckCircle2 size={13} />
                    Ready
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <span className="planned-label">Planned</span>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
