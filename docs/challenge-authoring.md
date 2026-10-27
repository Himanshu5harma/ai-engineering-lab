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

## First-twelve curriculum authoring

Add `production_review.md`, `tests/test_public.py`, `tests/test_hidden.py` and `tests/buggy_solution.py` to every ready package. Pytest wrappers parameterize the same JSON contracts and import only repository-authored trusted references through `content/conftest.py`. They never import learner submissions on the host. The production worker continues to grade returned JSON values outside the sandbox; it does not trust a student-reported pytest pass flag.

A fixture data marker `{"$set":["support"]}` decodes to a Python set for role/approval contracts. The bridge snapshots sets deterministically to detect input mutation. Markers are declarative data, not executable expressions. Nonfinite-float markers remain supported.

Run one package before proceeding to the next:

```bash
.venv/bin/pytest content/challenges/<slug>/tests -q
.venv/bin/python scripts/verify_challenge.py <slug>
```

The second command requires Docker and checks the reference in Run and Submit modes, then proves the starter and deliberate buggy implementation fail. `make integration` also checks all twelve through real PostgreSQL/API/worker lifecycles.

Stable curriculum IDs and learning order live in `content/curriculum.json`. They enrich learner metadata without changing existing grading hashes. `production_review.md` and pytest/mutant authoring files are outside the original grading digest; changing manual prompts does not invalidate a previous coding result. Grading metadata, problem, starter, hints, JSON suites, reference and explanation remain hashed. API and worker must still use the same grading bundle revision.

Engineering self-review is persisted in PostgreSQL by current grading version through `/api/v1/challenges/{slug}/review`. Six manual tasks cover performance, security, incident analysis, trade-offs, quality and interview explanation. The API validates task IDs and keeps code verification independent. Checkbox completion is learner self-report, not an automated quality, security or mastery score.
