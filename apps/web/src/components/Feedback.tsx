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
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <div>
        <strong>Something needs attention</strong>
        <p>{error.message}</p>
        {retry && (
          <button className="button small" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
