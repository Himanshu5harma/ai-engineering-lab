# Why it works
The invariant used_tokens ≤ context_limit-reserved_tokens holds before and after every inclusion. Whole-chunk selection avoids silently breaking source references. Sorting gives reproducible evidence selection independent of ingestion order.

Time: O(n log n); auxiliary space O(n). This policy prioritizes score order, not maximum total utility. Knapsack, per-source quotas, diversity-aware selection and MMR optimize different objectives and require separate evaluation.

Failure scenarios: undercounting prompt overhead, model/tokenizer version drift, and oversized high-ranked evidence. Follow-ups: account for provider-specific message wrappers and output reserves; compare answer quality under alternative allocation policies.
