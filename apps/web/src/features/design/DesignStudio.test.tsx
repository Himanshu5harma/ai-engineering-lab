import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { designApi } from "../../api/client";
import { DesignStudio } from "./DesignStudio";
import type { DesignChallenge } from "./types";

// Keep this UI fixture inside the web build boundary. Authored exercise validation
// is covered by the backend/content suite; this case isolates draft refresh behavior.
const content: Omit<
  DesignChallenge,
  "version_id" | "workspace" | "previous_draft_count"
> = {
  id: "D01",
  slug: "enterprise-rag-platform",
  version: 1,
  title: "Original architecture exercise",
  summary: "Practice a versioned architecture draft.",
  difficulty: "Senior / Production",
  timebox_minutes: 90,
  tags: ["RAG"],
  scenario: "Design a retrieval service with explicit engineering assumptions.",
  requirements: [
    "Authorize queries",
    "Retrieve evidence",
    "Cite sources",
    "Handle failures",
  ],
  scale: [
    "State document count",
    "State query rate",
    "State storage assumptions",
  ],
  constraints: ["Bound latency", "Isolate tenants", "Measure quality"],
  prompts: {
    diagram: "Draw components.",
    flow: "Describe request flow.",
    capacity: "State capacity assumptions.",
    failures: "Explain failure handling.",
    adr: "Defend the decision.",
  },
  rubric: ["boundaries", "retrieval", "capacity", "failures", "tradeoffs"].map(
    (id) => ({
      id,
      title: id,
      question: `Explain ${id}.`,
      evidence: "Record evidence.",
    }),
  ),
  follow_ups: [
    "Explain scaling.",
    "Explain recovery.",
    "Explain alternatives.",
  ],
};
vi.mock("./ArchitectureCanvas", () => ({
  ArchitectureCanvas: () => <div>Canvas</div>,
}));
vi.mock("../../api/client", async (original) => ({
  ...(await original<typeof import("../../api/client")>()),
  designApi: { challenge: vi.fn() },
}));
it("keeps an unsaved old-version design open when background content changes", async () => {
  const document = {
    diagram: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    flow: "",
    capacity: "",
    failures: "",
    adr: "",
    ratings: {},
  };
  const initial: DesignChallenge = {
    ...content,
    version_id: "enterprise-rag-platform:original",
    previous_draft_count: 0,
    workspace: {
      version_id: "enterprise-rag-platform:original",
      revision: 0,
      document,
      status: "draft",
      updated_at: null,
      completeness: {
        diagram: false,
        flow: false,
        capacity: false,
        failures: false,
        adr: false,
      },
      notice: "Self-review only",
      evidence_type: "learner_design_and_self_review",
      exercise_snapshot: null,
      source_version_id: null,
      source_revision: null,
    },
  };
  vi.mocked(designApi.challenge).mockResolvedValue(initial);
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={["/design/enterprise-rag-platform"]}>
        <Routes>
          <Route
            path="/design/:slug"
            element={<DesignStudio theme="light" />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(await screen.findByRole("tab", { name: "Data flow" }));
  const field = screen.getByRole("textbox", { name: "Request and data flow" });
  await userEvent.type(field, "Unsaved version-specific reasoning");
  act(() =>
    cache.setQueryData(["design", "enterprise-rag-platform"], {
      ...initial,
      version_id: "enterprise-rag-platform:updated",
      title: "Edited exercise",
    }),
  );
  expect(field).toHaveValue("Unsaved version-specific reasoning");
  expect(
    await screen.findByRole("button", {
      name: "Export and open current exercise",
    }),
  ).toBeVisible();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    content.title,
  );
});
