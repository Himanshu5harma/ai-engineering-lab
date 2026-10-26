import type { Progress } from "../api/client";
export function WeekActivity({ days }: { days: Progress["weekly_activity"] }) {
  const total = days.reduce((sum, day) => sum + day.executions, 0);
  return (
    <section className="panel week-panel">
      <div className="section-title">
        <h2>Practice this week</h2>
        <span className="subtle">UTC</span>
      </div>
      <div className="week-total">
        <strong>{total}</strong>
        <span>runs & submissions</span>
      </div>
      <div
        className="week-grid"
        aria-label="Executions over the last seven days"
      >
        {days.map((day) => (
          <div
            key={day.date}
            className="week-day"
            title={`${day.date}: ${day.executions} executions`}
          >
            <span>
              {new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en", {
                weekday: "narrow",
                timeZone: "UTC",
              })}
            </span>
            <strong className={day.executions ? "has-activity" : ""}>
              {day.executions || "–"}
            </strong>
          </div>
        ))}
      </div>
      <p className="week-caption">A little consistency goes a long way.</p>
    </section>
  );
}
