/** Thin domain adapters over the generated OpenAPI SDK. No duplicated wire contracts. */
import * as sdk from "./generated/sdk";
import type { components } from "./generated/schema";
import { unwrap } from "./transport";
import type { DesignDocument } from "../features/design/types";
export { ApiError } from "./transport";
export type Status = components["schemas"]["SubmissionView"]["status"];
export type Action = components["schemas"]["CreateSubmission"]["action"];
export type TestResult = components["schemas"]["ResultView"];
export type Submission = components["schemas"]["SubmissionView"];
export type ChallengeSummary = components["schemas"]["ChallengeSummary"];
export type Challenge = components["schemas"]["ChallengeDetail"];
export type Availability = components["schemas"]["ExecutionAvailability"];
export type Progress = components["schemas"]["ProgressView"];
export type Review = components["schemas"]["ReviewView"];
export type ReviewTaskKey =
  components["schemas"]["ReviewUpdate"]["completed_tasks"][number];
export type CurriculumItem = components["schemas"]["CurriculumEntry"];
export type Curriculum = components["schemas"]["CurriculumView"];
export const active = (status?: Status) =>
  status === "queued" || status === "running";
export const statusLabel = (status: string) => status.replaceAll("_", " ");

export const api = {
  challenges: () =>
    unwrap(sdk.listChallenges({ params: { query: { limit: 100 } } })),
  challenge: (slug: string) =>
    unwrap(sdk.getChallenge({ params: { path: { slug } } })),
  availability: () => unwrap(sdk.getExecution({})),
  progress: () => unwrap(sdk.getProgress({})),
  history: (slug: string, offset = 0) =>
    unwrap(
      sdk.listSubmissions({
        params: { query: { challenge_slug: slug, offset } },
      }),
    ),
  submissions: (offset = 0) =>
    unwrap(sdk.listSubmissions({ params: { query: { offset } } })),
  submission: (submission_id: string) =>
    unwrap(sdk.getSubmission({ params: { path: { submission_id } } })),
  execute: (challenge: Challenge, code: string, action: Action) =>
    unwrap(
      sdk.createSubmission({
        body: {
          challenge_slug: challenge.slug,
          version_id: challenge.version_id,
          code,
          action,
        },
      }),
    ),
};
export const curriculumApi = {
  plan: () => unwrap(sdk.getCurriculum({})),
  review: (slug: string) =>
    unwrap(sdk.getReview({ params: { path: { slug } } })),
  saveReview: (
    slug: string,
    version_id: string,
    completed_tasks: ReviewTaskKey[],
    notes: string,
    revision: number,
  ) =>
    unwrap(
      sdk.saveReview({
        params: { path: { slug } },
        body: { version_id, completed_tasks, notes, revision },
      }),
    ),
};
export const designApi = {
  list: () => unwrap(sdk.listDesigns({})),
  challenge: (slug: string) =>
    unwrap(sdk.getDesign({ params: { path: { slug } } })),
  previous: (slug: string) =>
    unwrap(sdk.listPreviousDrafts({ params: { path: { slug } } })),
  save: (
    slug: string,
    version_id: string,
    revision: number,
    document: DesignDocument,
    action: "save" | "submit_for_review",
    source?: { source_version_id: string; source_revision: number },
  ) =>
    unwrap(
      sdk.saveDesign({
        params: { path: { slug } },
        body: { version_id, revision, document, action, ...source },
      }),
    ),
};
