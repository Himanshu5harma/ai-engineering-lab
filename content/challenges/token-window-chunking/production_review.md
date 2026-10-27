# Production failure variant

A chunker emits a complete final window and then one extra fragment containing only duplicated overlap. Index size rises and retrieval returns repeated evidence. Identify the termination condition, quantify duplicated embeddings, and specify a regression test for a document exactly one window long.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
