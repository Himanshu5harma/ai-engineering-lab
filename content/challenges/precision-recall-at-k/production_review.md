# Production failure variant

An evaluation report improves after a retriever starts returning duplicate chunks. The scorer counts duplicate relevant IDs repeatedly and normalizes by the number of returned rows. Demonstrate the inflation, repair the cutoff/denominator policy, and version the evaluation definition.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
