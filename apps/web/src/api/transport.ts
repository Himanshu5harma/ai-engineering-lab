import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const transport = createClient<paths>({
  baseUrl:
    typeof location === "undefined" ? "http://localhost" : location.origin,
  fetch: (request) => globalThis.fetch(request),
});
transport.use({
  async onResponse({ response }) {
    if (response.ok) return response;
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    try {
      const body = await response.clone().json();
      if (typeof body.error?.message === "string") message = body.error.message;
      if (typeof body.error?.code === "string") code = body.error.code;
    } catch {
      /* Non-JSON proxy failures retain the HTTP status. */
    }
    throw new ApiError(message, response.status, code);
  },
  onError({ error }) {
    if (error instanceof ApiError) return error;
    return new Error(
      "Cannot reach the API. Check that FastAPI is running on port 8000.",
    );
  },
});

export async function unwrap<T>(
  result: Promise<{ data?: T; response: Response }>,
): Promise<T> {
  const { data, response } = await result;
  if (data === undefined)
    throw new ApiError("The API returned an empty response", response.status);
  return data;
}
