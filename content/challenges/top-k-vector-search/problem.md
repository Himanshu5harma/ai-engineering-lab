# Top-K vector search with stable ties

Rank candidate embeddings with stable cosine scores and reproducible tie-breaking.

## Implementation contract

Implement `top_k_similar(query, candidates, k)`. Each candidate has a unique nonempty string `id` and a `vector` matching the query dimensions. Return up to k `{id, score}` dictionaries, ordered by descending cosine similarity, then ascending ID on exact ties. A zero vector scores 0.0. Normalize safely before dot products; do not round scores.

Validate every candidate even when k is zero. Reject invalid dimensions, repeated IDs, booleans, non-numeric or nonfinite components, and integers outside float range with ValueError. Additional candidate metadata is ignored. Inputs are JSON lists; k is an integer excluding bool. Score comparisons use absolute tolerance 1e-9.

## Examples

`top_k_similar([1,0], [{"id":"b","vector":[0,1]}, {"id":"a","vector":[1,0]}], 1)` → `[{"id":"a","score":1.0}]`.

## Performance and security

1–2048 dimensions, at most 1000 candidates, and n×d ≤ 100000. k is 0–1000. The full suite shares an 8-second container budget.

Treat embedding metadata as untrusted. This function ranks already-authorized candidates; it does not enforce tenant authorization.
