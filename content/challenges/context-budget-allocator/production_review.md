# Production failure variant

A RAG service fits retrieved text exactly inside the advertised model window, then appends system instructions and conversation history. Requests fail or silently truncate citations. Find the missing reservation, establish per-stage accounting, and add a boundary regression case.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
