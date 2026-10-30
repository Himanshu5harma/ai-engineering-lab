import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock3,
  GitBranch,
  PenTool,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { designApi } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";
import { deliverables } from "../features/design/types";

export function DesignCatalog() {
  const query = useQuery({ queryKey: ["designs"], queryFn: designApi.list });
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
  const items = query.data.items;
  const started = items.filter((item) => item.workspace.revision > 0).length;
  const ready = items.filter(
    (item) => item.workspace.status === "ready_for_review",
  ).length;
  return (
    <div className="page design-catalog">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ARCHITECTURE PRACTICE</div>
          <h1>Design it. Defend your decisions.</h1>
          <p>
            Work through production constraints, draw the system, and explain
            the trade-offs.
          </p>
        </div>
        <span className="design-count">
          <PenTool size={17} /> {items.length} exercises ready
        </span>
      </div>
      <div className="design-intro">
        <section>
          <GitBranch size={22} />
          <h2>A canvas and a clear argument.</h2>
          <p>
            Five deliverables turn an architecture sketch into a reviewable
            design. Save drafts as you work, then use the rubric to test your
            reasoning.
          </p>
          <div className="design-deliverable-pills">
            {deliverables.map((item, index) => (
              <span key={item.id}>
                {index + 1} · {item.short}
              </span>
            ))}
          </div>
        </section>
        <aside>
          <span>YOUR DESIGN WORKSPACE</span>
          <div>
            <strong>
              {started}
              <small> started</small>
            </strong>
            <strong>
              {ready}
              <small> ready for review</small>
            </strong>
          </div>
          <p>
            <ShieldCheck size={14} /> Review readiness records completeness.
            Architecture quality requires engineering judgment.
          </p>
        </aside>
      </div>
      <div className="section-title">
        <h2>Production architecture challenges</h2>
        <Link className="text-link" to="/curriculum#system_design">
          View the full roadmap <ArrowRight size={14} />
        </Link>
      </div>
      <div className="design-cards">
        {items.map((item) => (
          <article className="design-card" key={item.id}>
            <div className="design-card-meta">
              <span className="curriculum-code">{item.id}</span>
              <span>
                <Clock3 size={13} /> {item.timebox_minutes} min suggested
              </span>
            </div>
            <h2>
              <Link to={`/design/${item.slug}`}>{item.title}</Link>
            </h2>
            <p>{item.summary}</p>
            {item.previous_draft_count > 0 && (
              <Link className="text-link" to={`/design/${item.slug}`}>
                {item.previous_draft_count} previous-version{" "}
                {item.previous_draft_count === 1 ? "draft" : "drafts"} available
              </Link>
            )}
            <div className="design-tags">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="design-card-progress">
              <span>
                {
                  Object.values(item.workspace.completeness).filter(Boolean)
                    .length
                }
                /5 deliverables drafted
              </span>
              <span>
                {item.workspace.status === "ready_for_review"
                  ? "Ready for review"
                  : item.workspace.revision
                    ? "Draft saved"
                    : "Not started"}
              </span>
            </div>
            <Link className="button primary" to={`/design/${item.slug}`}>
              {item.workspace.revision ? "Continue design" : "Start designing"}
              <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
