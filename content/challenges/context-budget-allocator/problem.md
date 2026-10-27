# Allocate evidence inside a context budget

Choose whole evidence chunks without spending the tokens reserved for instructions, conversation, and generation.

## Implementation contract

Implement `allocate_context(chunks, context_limit, reserved_tokens)`. Available evidence capacity equals context_limit minus reserved_tokens. Each chunk has a unique nonempty `id`, a positive integer `token_count`, and a finite numeric `score`.

Visit chunks by descending score and ascending ID on exact ties. Include a whole chunk only if it fits the remaining evidence capacity; skip oversized chunks and continue. Return `{selected_ids, used_tokens, remaining_tokens}`. Selected IDs remain in visitation order. Negative scores are valid; this policy does not apply a relevance threshold.

This is a specified deterministic greedy policy, not an optimal knapsack solver. Validate all inputs even if available capacity is zero. Reject duplicate IDs, boolean counts/budgets/scores, invalid types and nonfinite scores with ValueError. Additional chunk fields are ignored.

## Examples

With context_limit=12, reserved_tokens=4 and chunks a:(6 tokens,0.9), b:(4,0.8), c:(2,0.7), choose `["a","c"]`, use 8 evidence tokens, and leave 0.

## Performance and security

At most 1000 chunks; context_limit and each token_count are at most 1000000. The suite shares an 8-second budget.

Only already-authorized evidence may enter allocation. A token budget is not an authorization filter or an injection defense.
