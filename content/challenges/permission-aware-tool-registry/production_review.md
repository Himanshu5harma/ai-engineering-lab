# Production failure variant

An agent sees a destructive tool because missing required_roles is interpreted as public. A second path accepts an approved tool ID from the wrong tenant. Trace authorization to the actual dispatcher, remove permissive defaults, bind approval provenance, and add cross-tenant/missing-policy tests.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
