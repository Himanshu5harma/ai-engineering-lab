import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  LockKeyhole,
  XCircle,
} from "lucide-react";
import { active, statusLabel, type Submission } from "../../api/client";
import { Loading } from "../../components/Feedback";
export function Results({ submission }: { submission?: Submission }) {
  if (!submission)
    return (
      <div className="results-empty">
        <CircleDashed size={23} />
        <div>
          <strong>No test results yet</strong>
          <p>Run tests to inspect results. Submit checks the full suite.</p>
        </div>
      </div>
    );
  return (
    <div className="execution-results" aria-live="polite">
      <div className="result-heading">
        <strong className={`status-text ${submission.status}`}>
          {statusLabel(submission.status)}
        </strong>
        <span>
          {submission.action === "run" ? "PUBLIC TESTS" : "FULL VERIFICATION"}
        </span>
        {submission.duration_ms !== null && (
          <span>
            <Clock3 size={13} />
            {submission.duration_ms} ms
          </span>
        )}
      </div>
      <p className="result-message">{submission.message}</p>
      {active(submission.status) && (
        <Loading
          text={
            submission.status === "queued"
              ? "Waiting for the local worker…"
              : "Executing isolated Python…"
          }
        />
      )}
      {submission.action === "run" && submission.status === "passed" && (
        <div className="run-notice">
          Public tests passed. Submit to verify edge cases and record
          completion.
        </div>
      )}
      <div className="test-case-list">
        {submission.results.map((r, i) => (
          <details
            key={i}
            className={`test-case ${r.passed ? "test-pass" : "test-fail"}`}
          >
            <summary>
              {r.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <span>{r.name}</span>
              {r.hidden && <LockKeyhole size={12} />}
              <small>{r.passed ? "Passed" : "Failed"}</small>
            </summary>
            <div className="test-detail">
              {r.hidden ? (
                <p>
                  Private verification checks the documented contract. Inputs
                  and outputs stay private.
                </p>
              ) : (
                <>
                  <div>
                    <strong>Expected</strong>
                    <pre>{JSON.stringify(r.expected, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>Actual</strong>
                    <pre>{JSON.stringify(r.actual, null, 2)}</pre>
                  </div>
                  {r.stdout && (
                    <div>
                      <strong>Standard output / errors</strong>
                      <pre>{r.stdout}</pre>
                    </div>
                  )}
                </>
              )}
              {r.error && <p className="test-error">{r.error}</p>}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
