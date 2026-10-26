import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type Challenge } from "../../api/client";
import { Arena } from "./Arena";
vi.mock("./PythonEditor", () => ({
  PythonEditor: ({
    code,
    onChange,
  }: {
    code: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Python solution editor"
      value={code}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("../../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../api/client")>()),
  api: {
    challenge: vi.fn(),
    availability: vi.fn(),
    history: vi.fn(),
    execute: vi.fn(),
    submission: vi.fn(),
  },
}));
const challenge: Challenge = {
  slug: "test-challenge",
  version_id: "test:12345678",
  title: "Test challenge",
  summary: "Test behavior",
  difficulty: "Foundation",
  track: "retrieval",
  tags: ["retrieval"],
  public_count: 1,
  verification_count: 2,
  problem: "# Implement the function",
  starter_code: "def solve(): pass",
  hints: ["Think about zeros", "Validate first"],
  constraints: ["Validate dimensions"],
  learning_objectives: ["Stable math"],
  production_relevance: "Stable retrieval",
  public_cases: [{ name: "Sample", kwargs: { a: [1] }, expected: 1 }],
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/arena/test-challenge"]}>
        <Routes>
          <Route path="arena/:slug" element={<Arena theme="dark" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.challenge).mockResolvedValue(challenge);
  vi.mocked(api.availability).mockResolvedValue({
    available: true,
    message: "Ready",
  });
  vi.mocked(api.history).mockResolvedValue({ items: [], has_more: false });
});
describe("Coding Arena", () => {
  it("loads editable starter code and saves a draft", async () => {
    mount();
    const editor = await screen.findByRole("textbox", {
      name: "Python solution editor",
    });
    expect(editor).toHaveValue(challenge.starter_code);
    fireEvent.change(editor, { target: { value: "def solve(): return 1" } });
    await waitFor(() =>
      expect(localStorage.getItem("ael-draft:test:12345678")).toContain(
        "return 1",
      ),
    );
  });
  it("keeps execution unavailable explicit", async () => {
    vi.mocked(api.availability).mockResolvedValue({
      available: false,
      message: "Execution unavailable: worker stopped.",
    });
    mount();
    expect(
      await screen.findByRole("button", { name: "Run tests" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("worker stopped"),
    );
  });
  it("sends Run as a public action and displays terminal results", async () => {
    const row = {
      id: "job1",
      challenge_slug: challenge.slug,
      version_id: challenge.version_id,
      action: "run" as const,
      status: "queued" as const,
      created_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
      message: "Queued",
      results: [],
      code: null,
    };
    vi.mocked(api.execute).mockResolvedValue(row);
    vi.mocked(api.submission).mockResolvedValue({
      ...row,
      status: "passed",
      message: "1/1 tests passed",
    });
    mount();
    const run = await screen.findByRole("button", { name: "Run tests" });
    await waitFor(() => expect(run).toBeEnabled());
    fireEvent.click(run);
    expect(
      await screen.findByText(/Submit to verify edge cases/),
    ).toBeInTheDocument();
    expect(api.execute).toHaveBeenCalledWith(
      challenge,
      challenge.starter_code,
      "run",
    );
  });
  it("preserves editor contents when submission fails", async () => {
    vi.mocked(api.execute).mockRejectedValue(new Error("Execution queue full"));
    mount();
    const editor = await screen.findByRole("textbox", {
      name: "Python solution editor",
    });
    fireEvent.change(editor, { target: { value: "my current solution" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Execution queue full",
    );
    expect(editor).toHaveValue("my current solution");
  });
  it("reveals hints progressively", async () => {
    mount();
    fireEvent.click(await screen.findByRole("tab", { name: "Hints" }));
    expect(screen.queryByText("Think about zeros")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal next hint" }));
    expect(screen.getByText("Think about zeros")).toBeInTheDocument();
    expect(screen.queryByText("Validate first")).not.toBeInTheDocument();
  });
});
