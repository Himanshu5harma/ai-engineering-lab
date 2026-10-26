import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "./client";
afterEach(() => vi.unstubAllGlobals());
describe("API failure handling", () => {
  it("explains connectivity failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(request("/health")).rejects.toThrow("Cannot reach the API");
  });
  it("preserves structured server error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { message: "Worker stopped" } }),
            { status: 503 },
          ),
        ),
    );
    await expect(request("/execution")).rejects.toThrow("Worker stopped");
  });
  it("handles non-JSON proxy errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );
    await expect(request("/health")).rejects.toThrow("502");
  });
});
