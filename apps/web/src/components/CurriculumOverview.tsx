import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Bug, Code2, FlaskConical, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { curriculumApi } from "../api/client";
import { ErrorBox } from "./Feedback";

const icons = [Code2, Workflow, FlaskConical, Bug];
export function CurriculumOverview() {
  const plan = useQuery({
    queryKey: ["curriculum"],
    queryFn: curriculumApi.plan,
  });
  if (plan.error)
    return (
      <ErrorBox
        error={plan.error}
        retry={() => {
          void plan.refetch();
        }}
      />
    );
  if (!plan.data)
    return (
      <div className="curriculum-loading" role="status">
        Loading curriculum…
      </div>
    );
  return (
    <section className="curriculum-overview">
      <div className="section-title">
        <h2>Your engineering curriculum</h2>
        <Link to="/curriculum" className="text-link">
          {plan.data.total_planned} planned exercises
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="curriculum-module-grid">
        {plan.data.modules.map((module, index) => {
          const Icon = icons[index] || Code2;
          return (
            <Link
              key={module.id}
              to={
                module.id === "coding" ? "/arena" : `/curriculum#${module.id}`
              }
              className={module.available_count ? "module-ready" : ""}
            >
              <span className="module-heading">
                <Icon size={17} />
                <strong>{module.target_count}</strong>
              </span>
              <h3>{module.title}</h3>
              <span className="module-availability">
                {module.available_count
                  ? `${module.available_count} ready to practice`
                  : "Planned · not yet available"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
