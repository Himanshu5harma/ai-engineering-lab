import { Alert } from "./ui/primitives";
import { Button } from "./ui/button";
import { AlertCircle, LoaderCircle } from "lucide-react";
export function Loading({ text = "Loading workspace…" }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={20} className="spin" />
      {text}
    </div>
  );
}
export function ErrorBox({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <Alert className="error-box" variant="destructive">
      <AlertCircle size={18} />
      <div>
        <strong>Something needs attention</strong>
        <p>{error.message}</p>
        {retry && (
          <Button size="sm" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    </Alert>
  );
}
