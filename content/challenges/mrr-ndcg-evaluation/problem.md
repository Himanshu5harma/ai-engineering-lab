# Evaluate ranked results across queries

Calculate true mean reciprocal rank and graded nDCG across a reproducible query set.

## Implementation contract

Implement `ranking_metrics(queries, k)`. Each query is `{retrieved:[document IDs], relevance:{document ID:integer grade}}`. Grades are 0–5. Unjudged IDs have grade zero.

For each query, inspect the original first k positions. A repeated document gains relevance only at its first occurrence; repeats still consume rank positions. Reciprocal rank is 1/rank of the first positive-grade unique hit, or zero. DCG uses gain `2**grade-1` and discount `log2(rank+1)`. IDCG sorts all ground-truth grades descending and takes up to k; if IDCG is zero, nDCG is zero.

Return `{mrr, ndcg, per_query:[{reciprocal_rank, ndcg},...]}`. mrr and ndcg are arithmetic means across every provided query, including queries with no relevant labels. Preserve query order. An empty query set is invalid; do not fabricate an evaluation result.

Validate complete retrieved lists, even below cutoff, and every relevance label. Reject booleans/fractional grades, invalid IDs, missing fields and invalid k with ValueError.

## Examples

Two queries: perfect hit `["a"]` for `{a:1}`, then `["x","a"]` for `{a:1}`, k=2 → MRR=0.75 and mean nDCG≈0.8154648768.

## Performance and security

1–100 queries, at most 1000 retrieved IDs and relevance labels per query; k is 1–1000. The suite shares an 8-second container budget.

Metrics only reflect the supplied authorized labels and candidates. Security regressions must be gated independently of aggregate retrieval scores.
