import { Button } from "./ui/button";
import { downloadFile } from "../features/design/export";
export function RecoveryCopies<T>({
  copies,
  restore,
}: {
  copies: {
    key: string;
    value: T;
    revision: number;
    updatedAt: string;
    baseline: string;
  }[];
  restore: (copy: {
    key: string;
    value: T;
    revision: number;
    updatedAt: string;
    baseline: string;
  }) => void;
}) {
  if (!copies.length) return null;
  return (
    <details className="recovery-copies">
      <summary>
        {copies.length} browser recovery{" "}
        {copies.length === 1 ? "copy" : "copies"} available
      </summary>
      <p>
        These copies may belong to another open tab. Restoring uses the original
        base revision; saves still check for conflicts.
      </p>
      {copies.map((copy) => (
        <div key={copy.key}>
          <span>
            {new Date(copy.updatedAt).toLocaleString()} · base revision{" "}
            {copy.revision}
          </span>
          <Button size="sm" onClick={() => restore(copy)}>
            Restore copy
          </Button>
          <Button
            size="sm"
            onClick={() =>
              downloadFile(
                "browser-recovery.json",
                JSON.stringify(copy, null, 2),
                "application/json",
              )
            }
          >
            Export copy
          </Button>
        </div>
      ))}
    </details>
  );
}
