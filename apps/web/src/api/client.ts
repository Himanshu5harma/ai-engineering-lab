export type Status =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "timed_out"
  | "execution_error"
  | "infrastructure_error";
export type Action = "run" | "submit";
export type TestResult = {
  name: string;
  hidden: boolean;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error: string;
  stdout: string;
};
export type Submission = {
  id: string;
  challenge_slug: string;
  version_id: string;
  action: Action;
  status: Status;
  created_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  message: string;
  results: TestResult[];
  code: string | null;
};
export type ChallengeSummary = {
  slug: string;
  version_id: string;
  title: string;
  difficulty: string;
  track: string;
  tags: string[];
  summary: string;
  public_count: number;
};
export type Challenge = ChallengeSummary & {
  problem: string;
  starter_code: string;
  hints: string[];
  constraints: string[];
  learning_objectives: string[];
  production_relevance: string;
  verification_count: number;
  public_cases: {
    name: string;
    kwargs: Record<string, unknown>;
    expected?: unknown;
    raises?: string;
  }[];
};
export type Availability = { available: boolean; message: string };
export type Progress = {
  solved_slugs: string[];
  attempted: number;
  submissions: number;
  runs: number;
  total_challenges: number;
  weekly_activity: { date: string; executions: number }[];
  recent_submissions: Submission[];
  evidence_note: string;
};
export const active = (status?: Status) =>
  status === "queued" || status === "running";
export const statusLabel = (status: string) => status.replaceAll("_", " ");

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Check that FastAPI is running on port 8000.",
    );
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.error?.message || message;
    } catch {
      /* Preserve the HTTP error for non-JSON proxy responses. */
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
export const api = {
  challenges: () =>
    request<{ items: ChallengeSummary[]; total: number }>("/challenges"),
  challenge: (slug: string) =>
    request<Challenge>(`/challenges/${encodeURIComponent(slug)}`),
  availability: () => request<Availability>("/execution"),
  progress: () => request<Progress>("/progress"),
  history: (slug: string, offset = 0) =>
    request<{ items: Submission[]; has_more: boolean }>(
      `/submissions?challenge_slug=${encodeURIComponent(slug)}&offset=${offset}`,
    ),
  submissions: (offset = 0) =>
    request<{ items: Submission[]; has_more: boolean }>(
      `/submissions?offset=${offset}`,
    ),
  submission: (id: string) =>
    request<Submission>(`/submissions/${encodeURIComponent(id)}`),
  execute: (challenge: Challenge, code: string, action: Action) =>
    request<Submission>("/submissions", {
      method: "POST",
      body: JSON.stringify({
        challenge_slug: challenge.slug,
        version_id: challenge.version_id,
        code,
        action,
      }),
    }),
};
