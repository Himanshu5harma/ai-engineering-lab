import type { RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { designApi } from "../../api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { ErrorBox, Loading } from "../../components/Feedback";
import { designMarkdown, diagramSvg, downloadFile } from "./export";
import { deliverables, type DesignChallenge, type Workspace } from "./types";
export function PreviousDrafts({
  challenge,
  open,
  onOpenChange,
  carry,
  returnFocus,
}: {
  challenge: DesignChallenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carry: (draft: Workspace) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const previous = useQuery({
    queryKey: ["design-previous", challenge.slug],
    queryFn: () => designApi.previous(challenge.slug),
    enabled: open,
    staleTime: 0,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        <DialogHeader
          title="Previous-version drafts"
          description="Browse saved work from earlier exercise content. Export or explicitly copy it into the current draft; the original remains unchanged."
        />
        {previous.isPending ? (
          <Loading />
        ) : previous.error ? (
          <ErrorBox
            error={previous.error}
            retry={() => {
              void previous.refetch();
            }}
          />
        ) : !previous.data.items.length ? (
          <p>No saved drafts from previous content versions.</p>
        ) : (
          previous.data.items.map((item) => (
            <details className="previous-draft" key={item.version_id}>
              <summary>
                Content {item.version_id.split(":")[1]?.slice(0, 8)} · revision{" "}
                {item.revision} ·{" "}
                {item.updated_at && new Date(item.updated_at).toLocaleString()}
              </summary>
              <p>
                {item.exercise_snapshot
                  ? `Original exercise: ${item.exercise_snapshot.title}`
                  : "The original exercise brief was not recorded for this legacy draft. Your full diagram and writing are preserved."}
              </p>
              {item.exercise_snapshot && (
                <details>
                  <summary>Original brief</summary>
                  <p>{item.exercise_snapshot.scenario}</p>
                  <ul>
                    {item.exercise_snapshot.requirements.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </details>
              )}
              <p>
                {item.document.diagram.nodes.length} components ·{" "}
                {item.document.diagram.edges.length} connections
              </p>
              {deliverables
                .filter((entry) => entry.id !== "diagram")
                .map((entry) => (
                  <div key={entry.id}>
                    <strong>{entry.title}</strong>
                    <p className="preserve-lines">
                      {item.document[
                        entry.id as "flow" | "capacity" | "failures" | "adr"
                      ] || "No writing yet"}
                    </p>
                  </div>
                ))}
              <div className="previous-actions">
                <Button
                  onClick={() =>
                    downloadFile(
                      `${challenge.id}-previous.json`,
                      JSON.stringify(item, null, 2),
                      "application/json",
                    )
                  }
                >
                  Export JSON
                </Button>
                <Button
                  onClick={() =>
                    downloadFile(
                      `${challenge.id}-previous.svg`,
                      diagramSvg(item.document),
                      "image/svg+xml",
                    )
                  }
                >
                  Export SVG
                </Button>
                <Button
                  onClick={() =>
                    downloadFile(
                      `${challenge.id}-previous.md`,
                      designMarkdown(
                        {
                          ...challenge,
                          ...item.exercise_snapshot,
                          version_id: item.version_id,
                        },
                        item.document,
                      ),
                      "text/markdown",
                    )
                  }
                >
                  Export Markdown
                </Button>
                <Button variant="default" onClick={() => carry(item)}>
                  Carry work into current draft
                </Button>
              </div>
              <small>
                Copying exports any existing current work first. Current rubric
                IDs are kept; retired ratings remain in the original export.
                Review all assumptions against the current brief before saving.
              </small>
            </details>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
}
