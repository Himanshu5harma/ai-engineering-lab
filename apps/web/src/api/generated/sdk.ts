// Generated from FastAPI OpenAPI. Run npm run api:generate; do not edit.
import type { FetchOptions } from "openapi-fetch";
import type { paths } from "./schema";
import { transport } from "../transport";

export const listChallenges = (options: FetchOptions<paths["/api/v1/challenges"]["get"]>) => transport.GET("/api/v1/challenges", options);
export const getChallenge = (options: FetchOptions<paths["/api/v1/challenges/{slug}"]["get"]>) => transport.GET("/api/v1/challenges/{slug}", options);
export const getReview = (options: FetchOptions<paths["/api/v1/challenges/{slug}/review"]["get"]>) => transport.GET("/api/v1/challenges/{slug}/review", options);
export const saveReview = (options: FetchOptions<paths["/api/v1/challenges/{slug}/review"]["post"]>) => transport.POST("/api/v1/challenges/{slug}/review", options);
export const getCurriculum = (options: FetchOptions<paths["/api/v1/curriculum"]["get"]>) => transport.GET("/api/v1/curriculum", options);
export const getDashboard = (options: FetchOptions<paths["/api/v1/dashboard"]["get"]>) => transport.GET("/api/v1/dashboard", options);
export const listDesigns = (options: FetchOptions<paths["/api/v1/designs"]["get"]>) => transport.GET("/api/v1/designs", options);
export const getDesign = (options: FetchOptions<paths["/api/v1/designs/{slug}"]["get"]>) => transport.GET("/api/v1/designs/{slug}", options);
export const listPreviousDrafts = (options: FetchOptions<paths["/api/v1/designs/{slug}/previous-drafts"]["get"]>) => transport.GET("/api/v1/designs/{slug}/previous-drafts", options);
export const saveDesign = (options: FetchOptions<paths["/api/v1/designs/{slug}/workspace"]["post"]>) => transport.POST("/api/v1/designs/{slug}/workspace", options);
export const getExecution = (options: FetchOptions<paths["/api/v1/execution"]["get"]>) => transport.GET("/api/v1/execution", options);
export const getHealth = (options: FetchOptions<paths["/api/v1/health"]["get"]>) => transport.GET("/api/v1/health", options);
export const getProgress = (options: FetchOptions<paths["/api/v1/progress"]["get"]>) => transport.GET("/api/v1/progress", options);
export const listSubmissions = (options: FetchOptions<paths["/api/v1/submissions"]["get"]>) => transport.GET("/api/v1/submissions", options);
export const createSubmission = (options: FetchOptions<paths["/api/v1/submissions"]["post"]>) => transport.POST("/api/v1/submissions", options);
export const getSubmission = (options: FetchOptions<paths["/api/v1/submissions/{submission_id}"]["get"]>) => transport.GET("/api/v1/submissions/{submission_id}", options);
export const getResults = (options: FetchOptions<paths["/api/v1/submissions/{submission_id}/results"]["get"]>) => transport.GET("/api/v1/submissions/{submission_id}/results", options);
export const listTracks = (options: FetchOptions<paths["/api/v1/tracks"]["get"]>) => transport.GET("/api/v1/tracks", options);
