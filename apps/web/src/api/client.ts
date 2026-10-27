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
  curriculum_id?: string | null;
  learning_order?: number | null;
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
  production_review?: string;
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
  review_completed_slugs?: string[];
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
    request<{ items: ChallengeSummary[]; total: number }>(
      "/challenges?limit=100",
    ),
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

export type Review = {
  version_id: string;
  tasks: { id: string; title: string; description: string }[];
  completed_tasks: string[];
  notes: string;
  code_verified: boolean;
  updated_at: string | null;
  evidence_type: string;
  notice: string;
};
export type CurriculumItem = {
  id: string;
  title: string;
  difficulty: string | null;
  track: string | null;
  track_title: string | null;
  slug: string | null;
  focus: string | null;
  available: boolean;
  learning_order: number | null;
};
export type Curriculum = {
  title: string;
  total_planned: number;
  first_release: string[];
  weekly_hours: Record<string, number>;
  design_deliverables: string[];
  modules: {
    id: string;
    title: string;
    target_count: number;
    available_count: number;
    entries: CurriculumItem[];
  }[];
};
export const curriculumApi = {
  plan: () => request<Curriculum>("/curriculum"),
  review: (slug: string) =>
    request<Review>(`/challenges/${encodeURIComponent(slug)}/review`),
  saveReview: (
    slug: string,
    version_id: string,
    completed_tasks: string[],
    notes: string,
  ) =>
    request<Review>(`/challenges/${encodeURIComponent(slug)}/review`, {
      method: "POST",
      body: JSON.stringify({ version_id, completed_tasks, notes }),
    }),
};
