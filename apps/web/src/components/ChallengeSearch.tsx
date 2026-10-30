import { Input } from "./ui/primitives";
import { IconButton } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox, Loading } from "./Feedback";

export function ChallengeSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const catalog = useQuery({
    queryKey: ["challenges"],
    queryFn: api.challenges,
    enabled: open,
  });
  const items = (catalog.data?.items || []).filter((c) =>
    `${c.curriculum_id || ""} ${c.title} ${c.tags.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopPropagation();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", shortcut, true);
    return () => window.removeEventListener("keydown", shortcut, true);
  }, []);
  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      input.current?.focus();
    }
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  function go(slug: string) {
    setOpen(false);
    setSearch("");
    setSelected(0);
    navigate(`/arena/${slug}`);
  }
  return (
    <>
      <button
        className="global-search"
        aria-label="Search all challenges"
        onClick={() => setOpen(true)}
      >
        <Search size={15} />
        <span>Search challenges</span>
        <kbd>⌘ K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-labelledby="search-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(false);
        }}
      >
        <div className="search-dialog-inner">
          <div className="search-dialog-heading">
            <h2 id="search-title">Find your next challenge</h2>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close challenge search"
            >
              <X size={18} />
            </IconButton>
          </div>
          <label className="search-dialog-input">
            <Search size={19} />
            <Input
              ref={input}
              aria-label="Search all challenge content"
              placeholder="Search by problem or concept…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSelected((index) => Math.min(index + 1, items.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSelected((index) => Math.max(0, index - 1));
                }
                if (event.key === "Enter" && items[selected]) {
                  event.preventDefault();
                  go(items[selected].slug);
                }
              }}
            />
          </label>
          {catalog.isPending ? (
            <Loading text="Loading challenges…" />
          ) : catalog.error ? (
            <ErrorBox error={catalog.error} />
          ) : (
            <div className="search-dialog-results">
              {items.map((c, index) => (
                <button
                  key={c.slug}
                  className={index === selected ? "highlighted" : ""}
                  onClick={() => go(c.slug)}
                  onMouseEnter={() => setSelected(index)}
                >
                  <div>
                    <strong>
                      {c.curriculum_id && (
                        <span className="search-curriculum-code">
                          {c.curriculum_id}
                        </span>
                      )}
                      {c.title}
                    </strong>
                    <small>{c.tags.join(" · ")}</small>
                  </div>
                  <ArrowUpRight size={17} />
                </button>
              ))}
              {!items.length && (
                <div className="empty-state">
                  <strong>No matching challenges</strong>
                  <p>Try a topic such as embeddings or ranking.</p>
                </div>
              )}
            </div>
          )}
          <div className="search-dialog-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>Enter</kbd> to open <kbd>Esc</kbd> to close
            </span>
          </div>
        </div>
      </dialog>
    </>
  );
}
