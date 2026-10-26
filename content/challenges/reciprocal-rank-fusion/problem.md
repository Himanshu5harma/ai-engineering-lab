# Fuse retrieval rankings

Your knowledge search returns one lexical ranking and one semantic ranking. Implement `reciprocal_rank_fusion(lexical, semantic, k=60)`.

## Contract
For each unique document, add `1 / (k + rank)` from each list containing it. Rank is the original one-based position. Repeated IDs in one list contribute only at their first occurrence; do not compact subsequent positions.

Return dictionaries with `id` and `score`, sorted by descending score. Break exact score ties lexicographically by ID. Do not mutate the input lists.

Raise `ValueError` for k outside 1–1000, non-integer k (including bool), rankings longer than 1000, or IDs that are not nonempty strings. Empty rankings are valid.

## Example
`reciprocal_rank_fusion(["a", "b"], ["b", "c"], k=1)` →

`[{"id": "b", "score": 0.8333333333333333}, {"id": "a", "score": 0.5}, {"id": "c", "score": 0.3333333333333333}]`

`reciprocal_rank_fusion(["b", "b", "a"], [], k=1)` → b scores `1/2`, a scores `1/4`.
