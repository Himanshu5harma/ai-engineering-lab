# Why it works
Each unique relevant document contributes at most one hit. Slicing before deduplication preserves the cost of repeated results in the actual ranked output. Recall measures coverage of the labeled relevant set; precision measures the fraction of the specified K slots that contributed useful unique evidence.

Time: O(n+m) for validation and set construction; auxiliary space O(m+min(n,k)). A streaming evaluator can avoid retaining the entire retrieval list if upstream validation is trusted.

Follow-ups: distinguish document- from chunk-level relevance, incomplete relevance labels, macro versus micro aggregation, and per-tenant slices. High recall alone does not prove answer faithfulness or authorization correctness.

Primary background: https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html
