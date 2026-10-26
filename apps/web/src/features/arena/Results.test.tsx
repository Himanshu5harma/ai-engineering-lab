import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Submission } from "../../api/client";
import { Results } from "./Results";
const submission: Submission = {
  id: "1",
  challenge_slug: "test",
  version_id: "test:1",
  action: "run",
  status: "passed",
  created_at: "2026-10-26T12:00:00Z",
  completed_at: null,
  duration_ms: 31,
  message: "1/1 tests passed",
  results: [],
  code: null,
};
describe("execution evidence", () => {
  it("distinguishes public success from full verification", () => {
    render(<Results submission={submission} />);
    expect(screen.getByText(/Submit to verify edge cases/)).toBeInTheDocument();
    expect(screen.getByText("PUBLIC TESTS")).toBeInTheDocument();
  });
  it("shows queue progress", () => {
    render(<Results submission={{ ...submission, status: "queued" }} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for the local worker",
    );
  });
  it("shows public failure evidence and private case guidance", () => {
    render(
      <Results
        submission={{
          ...submission,
          action: "submit",
          status: "failed",
          results: [
            {
              name: "Orthogonal",
              hidden: false,
              passed: false,
              expected: 0,
              actual: 1,
              error: "Mismatch",
              stdout: "debug",
            },
            {
              name: "Verification case 2",
              hidden: true,
              passed: false,
              expected: null,
              actual: null,
              error: "Private case failed",
              stdout: "",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Mismatch")).toBeInTheDocument();
    expect(screen.getByText("debug")).toBeInTheDocument();
    expect(
      screen.getByText(/Inputs and outputs stay private/),
    ).toBeInTheDocument();
  });
});
