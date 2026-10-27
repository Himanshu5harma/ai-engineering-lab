# Production failure variant

An experiment dashboard reports reciprocal rank from only the last evaluated query as MRR. A second bug counts the same relevant chunk repeatedly in DCG. Construct a two-query counterexample, compare per-query traces, and define versioned aggregation semantics.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
