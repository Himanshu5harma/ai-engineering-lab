# Why it works
Each retrieval system contributes a bounded reciprocal-rank vote. Documents supported by both systems accumulate evidence. A per-list seen set prevents repeated results from inflating a score, while enumerating original positions preserves the rank contract.

Time: O(n + u log u) for n input entries and u unique IDs. Space: O(u). A weighted variant can tune retrieval contributions, but should be evaluated on a golden dataset. Rank fusion is robust to incomparable score scales; it does not guarantee better relevance.

## Failure scenarios and follow-ups
- Why should pagination and retrieval depth be versioned in evaluations?
- Where must tenant and version filters run relative to fusion?
- How would you evaluate k and reranking independently?
