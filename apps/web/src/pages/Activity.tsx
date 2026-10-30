import { Button, IconButton } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  History,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { active, api, statusLabel, type Submission } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";
import { Results } from "../features/arena/Results";

function download(row: Submission) {
  if (!row.code) return;
  const url = URL.createObjectURL(
    new Blob([row.code], { type: "text/x-python;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${row.challenge_slug}-${row.action}.py`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Activity() {
  const [params, setParams] = useSearchParams();
  const pageNumber = Number(params.get("page") || 0);
  const page =
    Number.isInteger(pageNumber) && pageNumber >= 0 && pageNumber < 100000
      ? pageNumber
      : 0;
  const selectedId = params.get("execution");
  const dialog = useRef<HTMLDialogElement>(null);
  const history = useQuery({
    queryKey: ["submissions", page * 20],
    queryFn: () => api.submissions(page * 20),
    refetchInterval: (query) =>
      query.state.data?.items.some((s) => active(s.status)) ? 1500 : 10000,
  });
  const catalog = useQuery({
    queryKey: ["challenges"],
    queryFn: api.challenges,
  });
  const detail = useQuery({
    queryKey: ["submission", selectedId],
    queryFn: () => api.submission(selectedId!),
    enabled: !!selectedId,
    refetchInterval: (query) =>
      active(query.state.data?.status) ? 600 : false,
  });
  useEffect(() => {
    if (selectedId && !dialog.current?.open) dialog.current?.showModal();
    if (!selectedId && dialog.current?.open) dialog.current.close();
  }, [selectedId]);
  function dismiss() {
    if (!selectedId) return;
    const next = new URLSearchParams(params);
    next.delete("execution");
    setParams(next, { replace: true });
  }
  function open(id: string) {
    const next = new URLSearchParams(params);
    next.set("execution", id);
    setParams(next);
  }
  function move(nextPage: number) {
    setParams(nextPage ? { page: String(nextPage) } : {});
  }
  const title = (slug: string) =>
    catalog.data?.items.find((c) => c.slug === slug)?.title || slug;
  return (
    <div className="page activity-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR ENGINEERING EVIDENCE</div>
          <h1>Activity</h1>
          <p>Every run, every iteration, and the results behind it.</p>
        </div>
        <Button
          onClick={() => {
            void history.refetch();
          }}
          disabled={history.isFetching}
        >
          <RefreshCw size={14} />
          Refresh history
        </Button>
      </div>
      <section className="execution-history">
        <div className="history-section-heading">
          <div>
            <History size={17} />
            <h2>Execution history</h2>
          </div>
          <span className="subtle">Newest first</span>
        </div>
        {history.isPending ? (
          <Loading />
        ) : history.error ? (
          <ErrorBox
            error={history.error}
            retry={() => {
              void history.refetch();
            }}
          />
        ) : !history.data.items.length ? (
          <div className="empty-state">
            <History size={26} />
            <strong>No executions on this page</strong>
            <p>Run or submit a challenge to save test evidence.</p>
            <Link to="/arena" className="button primary">
              Open Coding Arena
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Action</th>
                  <th>Result</th>
                  <th>Tests</th>
                  <th>Duration</th>
                  <th>Executed</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.data.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button
                        className="history-challenge-link"
                        onClick={() => open(s.id)}
                      >
                        {title(s.challenge_slug)}
                      </button>
                      <small>v{s.version_id.split(":")[1]?.slice(0, 7)}</small>
                    </td>
                    <td>
                      <span className={`action-pill ${s.action}`}>
                        {s.action === "run" ? "Run" : "Submit"}
                      </span>
                    </td>
                    <td>
                      <span className={`execution-status ${s.status}`}>
                        <i />
                        {statusLabel(s.status)}
                      </span>
                    </td>
                    <td>
                      {s.results.length
                        ? `${s.results.filter((r) => r.passed).length}/${s.results.length}`
                        : "—"}
                    </td>
                    <td>
                      {s.duration_ms === null ? "—" : `${s.duration_ms} ms`}
                    </td>
                    <td className="history-date">
                      {new Date(s.created_at).toLocaleDateString()}
                      <small>
                        {new Date(s.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => open(s.id)}
                        aria-label={`Inspect ${title(s.challenge_slug)} ${s.action} ${s.id}`}
                      >
                        Inspect
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {history.data && (
          <div className="table-pagination">
            <span>
              {history.data.items.length
                ? `${page * 20 + 1}–${page * 20 + history.data.items.length}`
                : "0"}{" "}
              executions shown
            </span>
            <div>
              <Button
                size="sm"

                disabled={page === 0}
                onClick={() => move(page - 1)}
              >
                <ArrowLeft size={13} />
                Newer
              </Button>
              <Button
                size="sm"

                disabled={!history.data.has_more}
                onClick={() => move(page + 1)}
              >
                Older
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </section>
      <p className="page-footnote">
        Run checks public tests. A passing Submit verifies the full suite.
        Select an execution to inspect its evidence and saved source.
      </p>
      <dialog
        ref={dialog}
        className="execution-dialog"
        aria-labelledby="execution-title"
        onClose={dismiss}
        onClick={(event) => {
          if (event.target === dialog.current) dismiss();
        }}
      >
        <div className="execution-dialog-inner">
          <header>
            <div>
              <span className="eyebrow">EXECUTION DETAILS</span>
              <h2 id="execution-title">
                {detail.data
                  ? title(detail.data.challenge_slug)
                  : "Saved execution"}
              </h2>
            </div>
            <IconButton onClick={dismiss} aria-label="Close execution details">
              <X size={19} />
            </IconButton>
          </header>
          {detail.isPending ? (
            <Loading />
          ) : detail.error ? (
            <ErrorBox
              error={detail.error}
              retry={() => {
                void detail.refetch();
              }}
            />
          ) : (
            detail.data && (
              <>
                <div className="execution-dialog-actions">
                  <span className="subtle">
                    {new Date(detail.data.created_at).toLocaleString()}
                  </span>
                  <div>
                    <Button
                      size="sm"

                      disabled={!detail.data.code}
                      onClick={() => download(detail.data!)}
                    >
                      <Download size={13} />
                      Export Python
                    </Button>
                    <Link
                      className="button small"
                      to={`/arena/${detail.data.challenge_slug}`}
                      onClick={dismiss}
                    >
                      Open challenge
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
                <Results submission={detail.data} />
                <details className="saved-source">
                  <summary>Saved source code</summary>
                  <pre>{detail.data.code || "Source unavailable"}</pre>
                </details>
              </>
            )
          )}
        </div>
      </dialog>
    </div>
  );
}
