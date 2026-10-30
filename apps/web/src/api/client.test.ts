import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
afterEach(() => vi.unstubAllGlobals());
describe("API failure handling", () => {
  it("explains connectivity failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.availability()).rejects.toThrow("Cannot reach the API");
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
    await expect(api.availability()).rejects.toThrow("Worker stopped");
  });
  it("handles non-JSON proxy errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );
    await expect(api.availability()).rejects.toThrow("502");
  });
});
