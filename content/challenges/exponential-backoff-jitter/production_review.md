# Production failure variant

Thousands of workers retry the same provider at exactly 1,2,4 seconds and recreate an outage on every attempt. Another implementation adds jitter after the cap and violates request deadlines. Design reproducible jitter tests and show how the executor enforces an overall deadline and idempotency.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
