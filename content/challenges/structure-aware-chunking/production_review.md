# Production failure variant

A support assistant cites a table row containing a model name but retrieves its limit from the next row after generic token splitting. Reproduce a row boundary at the chunk limit, distinguish parsing from chunking defects, and define a table-preserving regression fixture.

## Required engineering review

1. State time/space complexity and a measurable performance limit.
2. Identify a security boundary and explain where validation must happen.
3. Explain the incident root cause, evidence, fix, and regression test.
4. Compare an alternative implementation and its trade-offs.
5. Review types, names and test coverage.
6. Solve again without hints and defend the decision in an interview.

These are self-review tasks, separate from automated correctness.
