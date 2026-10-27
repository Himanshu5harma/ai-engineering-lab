# Production failure variant

A generated answer cites an existing document ID but invents the quoted policy text. Monitoring counts every recognized ID as a correct citation. Reproduce the false positive, add span validation, and explain the additional human or evaluated semantic checks still required.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
