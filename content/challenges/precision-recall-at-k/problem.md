# Measure retrieval without counting duplicates twice

Measure the quality of a fixed retrieval cutoff against a declared set of relevant document IDs.

## Implementation contract

Implement `precision_recall_at_k(retrieved, relevant, k)` returning `{precision:float, recall:float}`. Inspect the original first k retrieval positions. Count each relevant document at most once; duplicates consume positions and must not shift later results forward. Relevant labels are interpreted as a set, so duplicate ground-truth IDs do not inflate the denominator.

Precision@K is unique relevant hits divided by k, including when fewer than k results were returned. Missing result slots count as non-relevant. Recall@K is those hits divided by the number of unique relevant IDs; return 0.0 recall for empty ground truth. For empty ground truth, precision is also zero. These denominator choices are part of this contract; other evaluation conventions must be explicitly versioned.

Validate both complete ID lists, including retrieved entries beyond k. k must be an integer in 1–1000 excluding bool. IDs must be nonempty strings.

## Examples

`precision_recall_at_k(["a","b","c"],["a","c","d"],2)` → `{"precision":0.5,"recall":0.3333333333333333}`.

## Performance and security

Each list contains at most 10000 IDs; k is 1–1000. Full-suite execution is limited to 8 seconds.

Use synthetic or authorized evaluation datasets. Aggregate metrics must not conceal cross-tenant retrieval or missing security slices.
