# Production failure variant

After a worker-count increase, identical queries return tied documents in different orders and a retrieval regression gate becomes flaky. Reproduce an exact-score tie, identify the missing secondary ordering key, and define a deterministic regression test.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
