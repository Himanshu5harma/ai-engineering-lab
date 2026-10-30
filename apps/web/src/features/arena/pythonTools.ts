import PythonWorker from "./python.worker?worker";
import type {
  PythonToolRequest,
  PythonToolResponse,
} from "./editorPreferences";

export class PythonTools {
  private worker: Worker | null = null;
  private sequence = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: PythonToolResponse) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private stop(message: string) {
    this.worker?.terminate();
    this.worker = null;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error(message));
    }
    this.pending.clear();
  }
  request(code: string): Promise<PythonToolResponse> {
    if (!this.worker) {
      this.worker = new PythonWorker();
      this.worker.onmessage = ({ data }: MessageEvent<PythonToolResponse>) => {
        const item = this.pending.get(data.id);
        if (!item) return;
        clearTimeout(item.timer);
        this.pending.delete(data.id);
        if (data.error) item.reject(new Error(data.error));
        else item.resolve(data);
      };
      this.worker.onerror = () =>
        this.stop(
          "Local Python tools could not load. Try again or reload the editor.",
        );
    }
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.stop(
            "Local Python tools timed out. Your code is unchanged; try again.",
          ),
        15000,
      );
      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage({
        id,
        code,
      } satisfies PythonToolRequest);
    });
  }
  dispose() {
    this.stop("Editor closed");
  }
}
