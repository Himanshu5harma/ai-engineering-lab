# Authoring a challenge

Create a folder under `content/challenges/<slug>/`:

```text
metadata.yaml
problem.md
starter.py
hints.md
tests/public.json
tests/hidden.json
reference_solution.py
explanation.md
```

Metadata schema 1 requires slug (matching folder), integer version, title, difficulty, track, tags, function_name, summary, learning_objectives, constraints, and production_relevance. Unknown fields and invalid difficulties are rejected. See either existing package for the exact format. Tracks are discovered from metadata; their display names derive from slugs in this release.

A case has a unique `name`, JSON `kwargs`, and either `expected` or `raises: "ValueError"` / `"TypeError"`. Both suites require 1–50 cases; names are unique across them. Expected values are compared recursively. Numeric comparisons reject booleans and nonfinite values and use absolute tolerance 1e-9. List order and dictionary keys matter. Extra keys fail. The function must leave inputs unchanged.

```json
{"name": "Zero vector", "kwargs": {"a": [0, 0], "b": [1, 2]}, "expected": 0.0}
```

Hints are separated with a line containing `---`. Explain constraints, examples, failure cases, why the reference works, complexity, alternatives, and production trade-offs. Use original content and public/synthetic scenarios.

For private edge cases, a fixture-only object `{"$float":"nan"}` (also `inf` or `-inf`) decodes into a nonfinite float before invoking the function. It is data, never a Python expression. The reference tests use the same trusted decoder. Ordinary public examples use standard JSON values.

Keep solutions within the standard library. Sandbox contracts return JSON values; no network, host files, package installation, or model keys are available. The suite shares a module and runs sequentially in one container, with one total timeout. All cases together share a 64 KiB output budget; each captured test output is limited to 4096 characters. Keep cases small enough to fit the bounded environment payload.

After editing, run `make test` and `make integration`. Tests validate trusted reference functions against every public/private fixture and the worker runs references in real containers. Add focused tests for numeric or protocol cases that JSON cannot represent. Restart API and worker together to load content. A content edit changes the digest even when the human version stays the same; increment the human version for published changes. Historical code and results remain in PostgreSQL.

Do not add private fixtures or reference code to learner response schemas. Private test inputs, expected results, and output must remain redacted. The current UI has progressive hints; solution reveal is a future explicit learner action. The local repository owner can inspect the reference files directly.
