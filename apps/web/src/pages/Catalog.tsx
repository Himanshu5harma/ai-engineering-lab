import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Code2,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/Feedback";
import { useBookmarks } from "../hooks/useBookmarks";

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const { saved, toggle, error } = useBookmarks();
  const catalog = useQuery({
    queryKey: ["challenges"],
    queryFn: api.challenges,
  });
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  if (catalog.isPending) return <Loading />;
  if (catalog.error)
    return (
      <ErrorBox
        error={catalog.error}
        retry={() => {
          void catalog.refetch();
        }}
      />
    );
  const search = params.get("q") || "";
  const difficulty = params.get("difficulty") || "All difficulties";
  const topic = params.get("topic") || "";
  const status = params.get("status") || "all";
  const sort = params.get("sort") || "recommended";
  const solved = new Set(progress.data?.solved_slugs || []);
  const topics = [...new Set(catalog.data.items.flatMap((c) => c.tags))].sort();
  const rank = [
    "Foundation",
    "Intermediate",
    "Advanced",
    "Senior / Production",
  ];
  const items = catalog.data.items
    .filter(
      (c) =>
        `${c.title} ${c.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (difficulty === "All difficulties" || c.difficulty === difficulty) &&
        (!topic || c.tags.includes(topic)) &&
        (status === "all" ||
          (status === "verified" && solved.has(c.slug)) ||
          (status === "unsolved" && !solved.has(c.slug)) ||
          (status === "saved" && saved.includes(c.slug))),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : rank.indexOf(a.difficulty) - rank.indexOf(b.difficulty),
    );
  const counts: Record<string, number> = {
    all: catalog.data.total,
    unsolved: catalog.data.items.filter((c) => !solved.has(c.slug)).length,
    verified: catalog.data.items.filter((c) => solved.has(c.slug)).length,
    saved: catalog.data.items.filter((c) => saved.includes(c.slug)).length,
  };
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (
      !value ||
      value === "all" ||
      value === "All difficulties" ||
      value === "recommended"
    )
      next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: key === "q" });
  }
  return (
    <div className="page catalog">
      <div className="page-heading">
        <div>
          <div className="eyebrow">IMPLEMENT · TEST · UNDERSTAND</div>
          <h1>Coding Arena</h1>
          <p>Build the small things that make reliable AI systems work.</p>
        </div>
        <span className="library-badge">
          <Code2 size={15} />
          Python 3.12<span>Standard library</span>
        </span>
      </div>
      <div className="catalog-layout">
        <aside className="topic-sidebar" aria-label="Challenge topics">
          <div className="topic-sidebar-heading">
            <Filter size={15} />
            <h2>Explore topics</h2>
          </div>
          <button
            className={!topic ? "selected" : ""}
            onClick={() => filter("topic", "")}
          >
            <span>All topics</span>
            <small>{catalog.data.total}</small>
          </button>
          {topics.map((value) => (
            <button
              key={value}
              className={topic === value ? "selected" : ""}
              onClick={() => filter("topic", value)}
            >
              <span>{value}</span>
              <small>
                {
                  catalog.data.items.filter((c) => c.tags.includes(value))
                    .length
                }
              </small>
            </button>
          ))}
          <div className="topic-sidebar-note">
            <strong>Embeddings & retrieval</strong>
            <p>
              Original challenges with public tests, private verification, and
              production context.
            </p>
            <span>Learn by implementing.</span>
          </div>
        </aside>
        <div className="catalog-main">
          <div className="catalog-tabs" aria-label="Challenge status">
            {[
              ["all", "All challenges"],
              ["unsolved", "To practice"],
              ["verified", "Verified"],
              ["saved", "Saved"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={status === value}
                className={status === value ? "selected" : ""}
                disabled={
                  (value === "verified" || value === "unsolved") &&
                  !progress.data
                }
                onClick={() => filter("status", value)}
              >
                {value === "saved" && <Bookmark size={13} />}
                {label}
                <span>{counts[value]}</span>
              </button>
            ))}
          </div>
          <div className="filter-bar">
            <label className="search-input">
              <Search size={17} />
              <input
                aria-label="Search challenges"
                value={search}
                onChange={(e) => filter("q", e.target.value)}
                placeholder="Search problems or skills…"
              />
            </label>
            <select
              aria-label="Filter by difficulty"
              value={difficulty}
              onChange={(e) => filter("difficulty", e.target.value)}
            >
              {["All difficulties", ...rank].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Sort challenges"
              value={sort}
              onChange={(e) => filter("sort", e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
          <div className="catalog-results-heading">
            <span>
              {items.length} {items.length === 1 ? "challenge" : "challenges"}
              {topic ? ` in ${topic}` : ""}
            </span>
            {params.size > 0 && (
              <button className="text-link" onClick={() => setParams({})}>
                <X size={13} />
                Reset filters
              </button>
            )}
          </div>
          {error && (
            <div className="inline-warning" role="alert">
              {error}
            </div>
          )}
          {progress.error && (
            <ErrorBox
              error={progress.error}
              retry={() => {
                void progress.refetch();
              }}
            />
          )}
          <div className="challenge-list">
            {items.map((c, index) => (
              <article key={c.slug} className="challenge-card">
                <Link to={`/arena/${c.slug}`} className="challenge-main-link">
                  <span className="challenge-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="challenge-card-content">
                    <div className="challenge-title-row">
                      <h2>{c.title}</h2>
                      {solved.has(c.slug) && (
                        <span className="solved">
                          <CheckCircle2 size={14} />
                          Verified
                        </span>
                      )}
                    </div>
                    <p>{c.summary}</p>
                    <div className="tag-row">
                      {c.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="challenge-card-bottom">
                      <span
                        className={`difficulty ${c.difficulty.toLowerCase()}`}
                      >
                        {c.difficulty}
                      </span>
                      <span>{c.public_count} public tests</span>
                      <span>Python</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
                <button
                  className={`save-challenge ${saved.includes(c.slug) ? "is-saved" : ""}`}
                  aria-label={`${saved.includes(c.slug) ? "Unsave" : "Save"} ${c.title}`}
                  aria-pressed={saved.includes(c.slug)}
                  onClick={() => toggle(c.slug)}
                >
                  <Bookmark
                    size={17}
                    fill={saved.includes(c.slug) ? "currentColor" : "none"}
                  />
                </button>
              </article>
            ))}
          </div>
          {!items.length && (
            <div className="empty-state catalog-empty">
              <Search size={25} />
              <strong>
                {status === "saved"
                  ? "Keep a challenge for later"
                  : "No challenges in this view"}
              </strong>
              <p>
                {status === "saved"
                  ? "Use the bookmark on a challenge to save it in this browser."
                  : "Try a different topic or reset your filters."}
              </p>
              <button className="button" onClick={() => setParams({})}>
                View all challenges
              </button>
            </div>
          )}
          <div className="catalog-footer">
            <span className="accent-dot" />
            <p>
              Run checks public cases. Submit verifies the full suite and
              records completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
